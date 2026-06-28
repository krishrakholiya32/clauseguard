import asyncio
import json

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from PIL import Image

from app.core.config import settings
from app.services.redflags import get_checklist

RATE_LIMIT_MESSAGE = (
    "All Gemini API keys are rate-limited (free tier). "
    "Please wait a minute and try again."
)

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

FOLLOWUP_SYSTEM_NOTE = (
    "Answer strictly based on the document content provided. "
    "If the document doesn't address the question, say so clearly instead of guessing. "
    "Do not give definitive legal advice."
)


def _is_rate_limit(exc: Exception) -> bool:
    s = str(exc)
    return (
        isinstance(exc, ResourceExhausted)
        or "429" in s
        or "quota" in s.lower()
        or "RESOURCE_EXHAUSTED" in s
        or "rate limit" in s.lower()
    )


def _active_keys() -> list[str]:
    return [k for k in [settings.gemini_api_key, settings.gemini_api_key_2] if k]


async def _gemini_call(make_call):
    """
    Tries each configured Gemini key in order, rotating on rate-limit errors.
    make_call() must create the GenerativeModel INSIDE itself so it picks up
    whichever key was set by genai.configure() for that attempt.
    """
    keys = _active_keys()
    if not keys:
        raise RuntimeError("No GEMINI_API_KEY configured")

    last_exc: Exception | None = None
    for key in keys:
        try:
            def _run(k=key, fn=make_call):
                genai.configure(api_key=k)
                return fn()
            return await asyncio.to_thread(_run)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            last_exc = exc
            print(f"[LLM] Key ...{key[-6:]} rate limited, rotating to next key")

    raise RuntimeError(RATE_LIMIT_MESSAGE) from last_exc


def _parse_json_response(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned)


async def extract_text_from_images(images: list[Image.Image]) -> str:
    results = []
    for img in images:
        def _call(image=img):
            model = genai.GenerativeModel(settings.gemini_model)
            return model.generate_content(
                [image, "Transcribe all text visible in this document page exactly as written. Output only the transcribed text."]
            )
        response = await _gemini_call(_call)
        results.append(response.text)
    return "\n\n".join(results)


async def analyze_document(doc_type: str, content: str) -> dict:
    checklist = "\n".join(f"- {item}" for item in get_checklist(doc_type))
    prompt = ANALYSIS_PROMPT_TEMPLATE.format(doc_type=doc_type, checklist=checklist, content=content)

    def _call():
        model = genai.GenerativeModel(settings.gemini_model, system_instruction=SYSTEM_INSTRUCTION)
        return model.generate_content(prompt)

    response = await _gemini_call(_call)
    return _parse_json_response(response.text)


async def answer_followup(document_text: str, history: list[dict], question: str) -> str:
    convo = [
        {"role": "user", "parts": [f"{FOLLOWUP_SYSTEM_NOTE}\n\nDocument content:\n{document_text}"]},
        {"role": "model", "parts": ["Understood, I'll answer based only on this document."]},
    ]
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        convo.append({"role": role, "parts": [msg["content"]]})

    def _call():
        model = genai.GenerativeModel(settings.gemini_model, system_instruction=SYSTEM_INSTRUCTION)
        chat = model.start_chat(history=convo)
        return chat.send_message(question)

    response = await _gemini_call(_call)
    return response.text
