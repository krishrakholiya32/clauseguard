"""Extracts text from PDFs/DOCX/images for LLM analysis.

Text-based PDFs and DOCX files are extracted directly (fast, free, no LLM call).
Scanned/photographed PDFs and plain images are rendered to page images and handed to
the Gemini vision model inside llm_service, since one model call there does OCR +
understanding together.
"""
import io

import docx
import fitz  # PyMuPDF
from PIL import Image

MIN_CHARS_PER_PAGE_TO_TRUST_TEXT_LAYER = 20


def is_pdf(path: str) -> bool:
    return path.lower().endswith(".pdf")


def is_docx(path: str) -> bool:
    return path.lower().endswith(".docx")


def extract_docx(path: str) -> str:
    document = docx.Document(path)
    return "\n".join(p.text for p in document.paragraphs if p.text.strip())


def extract_pdf(path: str) -> tuple[str | None, list[Image.Image]]:
    """Returns (text, page_images). text is set if every page has a usable text layer;
    otherwise page_images is populated for vision-based extraction."""
    doc = fitz.open(path)
    texts = []
    needs_vision = False

    for page in doc:
        page_text = page.get_text().strip()
        if len(page_text) < MIN_CHARS_PER_PAGE_TO_TRUST_TEXT_LAYER:
            needs_vision = True
            break
        texts.append(page_text)

    if not needs_vision:
        doc.close()
        return "\n\n".join(texts), []

    page_images = []
    for page in doc:
        pix = page.get_pixmap(dpi=200)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        page_images.append(img)
    doc.close()
    return None, page_images


def load_image(path: str) -> Image.Image:
    return Image.open(path)
