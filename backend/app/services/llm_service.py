import asyncio
import json

import google.generativeai as genai
from PIL import Image

from app.core.config import settings
from app.services.redflags import get_checklist

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_INSTRUCTION = """You are ClauseGuard, an assistant that helps Indian consumers \
understand contracts (rental agreements, employment offers, loan documents, etc.) in \
plain English. You are NOT a lawyer and must never give definitive legal advice or \
state that a clause is illegal with certainty — instead flag clauses as unusual, \
one-sided, or worth reviewing with a lawyer. Always be specific about WHY a clause is \
risky, referencing common Indian market/legal conventions where relevant."""

ANALYSIS_PROMPT_TEMPLATE = """Analyze the following {doc_type} document for a person in India.

Common red flags to specifically check for in this type of document:
{checklist}

Respond with ONLY valid JSON (no markdown fences) in this exact shape:
{{
  "summary": "2-4 sentence plain-English overview of what this document is and its overall fairness",
  "overall_risk": "green" | "yellow" | "red",
  "clauses": [
    {{"text": "short quote or reference to the clause", "plain_english": "what it means in simple terms", "risk": "green" | "yellow" | "red", "reason": "why this risk level, referencing the checklist if relevant"}}
  ],
  "negotiation_tips": ["concrete, actionable suggestions the person could raise with the other party"]
}}

Document content:
{content}
"""

FOLLOWUP_SYSTEM_NOTE = "Answer strictly based on the document content provided. If the document doesn't address the question, say so clearly instead of guessing. Do not give definitive legal advice."


def _model():
    return genai.GenerativeModel(settings.gemini_model, system_instruction=SYSTEM_INSTRUCTION)


def _parse_json_response(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned)


async def extract_text_from_images(images: list[Image.Image]) -> str:
    """Runs OCR/transcription via Gemini vision, one call per page, in parallel."""

    async def transcribe_page(img: Image.Image) -> str:
        model = genai.GenerativeModel(settings.gemini_model)
        response = await asyncio.to_thread(
            model.generate_content,
            [img, "Transcribe all text visible in this document page exactly as written. Output only the transcribed text."],
        )
        return response.text

    results = await asyncio.gather(*(transcribe_page(img) for img in images))
    return "\n\n".join(results)


async def analyze_document(doc_type: str, content: str) -> dict:
    checklist = "\n".join(f"- {item}" for item in get_checklist(doc_type))
    prompt = ANALYSIS_PROMPT_TEMPLATE.format(doc_type=doc_type, checklist=checklist, content=content)
    model = _model()
    response = await asyncio.to_thread(model.generate_content, prompt)
    return _parse_json_response(response.text)


async def answer_followup(document_text: str, history: list[dict], question: str) -> str:
    model = _model()
    convo = [
        {"role": "user", "parts": [f"{FOLLOWUP_SYSTEM_NOTE}\n\nDocument content:\n{document_text}"]},
        {"role": "model", "parts": ["Understood, I'll answer based only on this document."]},
    ]
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        convo.append({"role": role, "parts": [msg["content"]]})

    chat = model.start_chat(history=convo)
    response = await asyncio.to_thread(chat.send_message, question)
    return response.text
