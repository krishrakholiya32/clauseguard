import asyncio
import json

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from PIL import Image

from app.core.config import settings
from app.services.redflags import get_checklist

genai.configure(api_key=settings.gemini_api_key)

RATE_LIMIT_RETRY_DELAYS = [5, 15, 40]  # seconds — exponential-ish backoff for 429s
RATE_LIMIT_MESSAGE = (
    "Gemini API rate limit reached (free tier allows a limited number of requests "
    "per minute). Please wait about a minute and try again."
)


def _is_rate_limit_error(exc: Exception) -> bool:
    exc_str = str(exc)
    return (
        isinstance(exc, ResourceExhausted)
        or "429" in exc_str
        or "quota" in exc_str.lower()
        or "RESOURCE_EXHAUSTED" in exc_str
        or "rate limit" in exc_str.lower()
    )


async def _generate_with_retry(fn, *args, **kwargs):
    """Runs a blocking Gemini SDK call in a thread, retrying on 429s with backoff."""
    last_exc: Exception | None = None
    for delay in [*RATE_LIMIT_RETRY_DELAYS, None]:
        try:
            return await asyncio.to_thread(fn, *args, **kwargs)
        except Exception as exc:
            if not _is_rate_limit_error(exc):
                raise
            last_exc = exc
            if delay is None:
                raise RuntimeError(RATE_LIMIT_MESSAGE) from exc
            await asyncio.sleep(delay)
    raise RuntimeError(RATE_LIMIT_MESSAGE) from last_exc

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
    """Runs OCR/transcription via Gemini vision sequentially to stay within free-tier rate limits."""
    results = []
    for img in images:
        model = genai.GenerativeModel(settings.gemini_model)
        response = await _generate_with_retry(
            model.generate_content,
            [img, "Transcribe all text visible in this document page exactly as written. Output only the transcribed text."],
        )
        results.append(response.text)
    return "\n\n".join(results)


async def analyze_document(doc_type: str, content: str) -> dict:
    checklist = "\n".join(f"- {item}" for item in get_checklist(doc_type))
    prompt = ANALYSIS_PROMPT_TEMPLATE.format(doc_type=doc_type, checklist=checklist, content=content)
    model = _model()
    response = await _generate_with_retry(model.generate_content, prompt)
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
    response = await _generate_with_retry(chat.send_message, question)
    return response.text
