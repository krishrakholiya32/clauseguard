import asyncio
import base64
import io
import json

import google.generativeai as genai
import httpx
from google.api_core.exceptions import ResourceExhausted
from PIL import Image

from app.core.config import settings
from app.services.redflags import get_checklist

RATE_LIMIT_MESSAGE = (
    "All AI providers are currently rate-limited. "
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


# ── Helpers ─────────────────────────────────────────────────────────────────

def _is_rate_limit(exc: Exception) -> bool:
    s = str(exc)
    return (
        isinstance(exc, ResourceExhausted)
        or "429" in s
        or "quota" in s.lower()
        or "RESOURCE_EXHAUSTED" in s
        or "rate limit" in s.lower()
        or "rate_limit" in s.lower()
    )


def _gemini_keys() -> list[str]:
    return settings.all_gemini_keys


def _groq_keys() -> list[str]:
    return settings.all_groq_keys


def _parse_json_response(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned)


# ── Gemini calls ─────────────────────────────────────────────────────────────

async def _gemini_text(prompt: str, system: str, key: str) -> str:
    def _call():
        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            settings.gemini_model,
            system_instruction=system or None,
        )
        return model.generate_content(prompt).text
    return await asyncio.to_thread(_call)


async def _gemini_chat(history: list[dict], system: str, question: str, key: str) -> str:
    """history: list of {role: 'user'|'model', content: str}"""
    def _call():
        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            settings.gemini_model,
            system_instruction=system or None,
        )
        convo = [{"role": m["role"], "parts": [m["content"]]} for m in history]
        chat = model.start_chat(history=convo)
        return chat.send_message(question).text
    return await asyncio.to_thread(_call)


async def _gemini_ocr(image: Image.Image, key: str) -> str:
    def _call():
        genai.configure(api_key=key)
        model = genai.GenerativeModel(settings.gemini_model)
        return model.generate_content([image, OCR_PROMPT]).text
    return await asyncio.to_thread(_call)


# ── Groq calls ───────────────────────────────────────────────────────────────

def _groq_headers(key: str) -> dict:
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


async def _groq_text(prompt: str, system: str, key: str) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=_groq_headers(key),
            json={"model": settings.groq_model, "messages": messages, "max_tokens": 4000},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


OCR_PROMPT = "Transcribe all text visible in this document page exactly as written. Output only the transcribed text."


async def _groq_ocr(image: Image.Image, key: str) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    payload = {
        "model": settings.groq_vision_model,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                {"type": "text", "text": OCR_PROMPT},
            ],
        }],
        "max_tokens": 4000,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=_groq_headers(key),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _groq_chat(history: list[dict], system: str, question: str, key: str) -> str:
    """history: list of {role: 'user'|'model', content: str}"""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    for m in history:
        role = "assistant" if m["role"] == "model" else "user"
        messages.append({"role": role, "content": m["content"]})
    messages.append({"role": "user", "content": question})

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=_groq_headers(key),
            json={"model": settings.groq_model, "messages": messages, "max_tokens": 2000},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ── Fallback chains ──────────────────────────────────────────────────────────

async def _text_with_fallback(prompt: str, system: str) -> str:
    """Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2."""
    for key in _gemini_keys():
        try:
            return await _gemini_text(prompt, system, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Gemini ...{key[-6:]} rate limited, trying next")

    for key in _groq_keys():
        try:
            return await _groq_text(prompt, system, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Groq ...{key[-6:]} rate limited, trying next")

    raise RuntimeError(RATE_LIMIT_MESSAGE)


async def _chat_with_fallback(history: list[dict], system: str, question: str) -> str:
    """Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2."""
    for key in _gemini_keys():
        try:
            return await _gemini_chat(history, system, question, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Gemini ...{key[-6:]} rate limited, trying next")

    for key in _groq_keys():
        try:
            return await _groq_chat(history, system, question, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Groq ...{key[-6:]} rate limited, trying next")

    raise RuntimeError(RATE_LIMIT_MESSAGE)


async def _ocr_with_fallback(image: Image.Image) -> str:
    """Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2.

    Both providers' configured models are vision-capable (Gemini natively;
    Groq via qwen/qwen3.6-27b), so OCR gets the same resilience as text/chat
    instead of failing outright whenever both Gemini keys are exhausted.
    """
    for key in _gemini_keys():
        try:
            return await _gemini_ocr(image, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Gemini ...{key[-6:]} rate limited for OCR, trying next")

    for key in _groq_keys():
        try:
            return await _groq_ocr(image, key)
        except Exception as exc:
            if not _is_rate_limit(exc):
                raise
            print(f"[LLM] Groq ...{key[-6:]} rate limited for OCR, trying next")

    raise RuntimeError(RATE_LIMIT_MESSAGE)


# ── Public API ───────────────────────────────────────────────────────────────

async def extract_text_from_images(images: list[Image.Image]) -> str:
    results = []
    for img in images:
        results.append(await _ocr_with_fallback(img))
    return "\n\n".join(results)


async def analyze_document(doc_type: str, content: str) -> dict:
    checklist = "\n".join(f"- {item}" for item in get_checklist(doc_type))
    prompt = ANALYSIS_PROMPT_TEMPLATE.format(doc_type=doc_type, checklist=checklist, content=content)
    raw = await _text_with_fallback(prompt, SYSTEM_INSTRUCTION)
    return _parse_json_response(raw)


async def answer_followup(document_text: str, history: list[dict], question: str) -> str:
    # Neutral {role, content} format — Gemini uses 'model', Groq converts to 'assistant'
    messages = [
        {"role": "user", "content": f"{FOLLOWUP_SYSTEM_NOTE}\n\nDocument content:\n{document_text}"},
        {"role": "model", "content": "Understood, I'll answer based only on this document."},
    ]
    for msg in history:
        messages.append({
            "role": "model" if msg["role"] == "assistant" else "user",
            "content": msg["content"],
        })
    return await _chat_with_fallback(messages, SYSTEM_INSTRUCTION, question)
