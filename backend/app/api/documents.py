import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.chat_message import ChatMessage
from app.models.document import Document
from app.models.user import User
from app.schemas.document import AnalysisResponse, ChatMessageResponse, ChatRequest, DocumentResponse
from app.services import llm_service
from app.services.processor import process_document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_DOC_TYPES = {"rental", "employment", "loan", "freelance", "nda", "sale", "insurance", "partnership", "vendor", "consulting", "software", "other"}
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx"}


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form("other"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type must be one of {ALLOWED_DOC_TYPES}")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{ext}"
    storage_path = os.path.join(settings.upload_dir, stored_name)

    contents = await file.read()
    with open(storage_path, "wb") as f:
        f.write(contents)

    document = Document(
        user_id=current_user.id,
        filename=file.filename or stored_name,
        doc_type=doc_type,
        storage_path=storage_path,
        status="pending",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(process_document, document.id)

    return await _to_response(document, db)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.scalars(
        select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    )
    documents = result.all()
    return [await _to_response(d, db) for d in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await _get_owned_document(document_id, db, current_user)
    return await _to_response(document, db)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await _get_owned_document(document_id, db, current_user)
    if os.path.exists(document.storage_path):
        os.remove(document.storage_path)
    await db.delete(document)
    await db.commit()


@router.post("/{document_id}/chat", response_model=ChatMessageResponse)
async def chat_with_document(
    document_id: int,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await _get_owned_document(document_id, db, current_user)
    if document.status != "done" or not document.extracted_text:
        raise HTTPException(status_code=400, detail="Document is not ready for chat yet")

    history_result = await db.scalars(
        select(ChatMessage).where(ChatMessage.document_id == document_id).order_by(ChatMessage.created_at)
    )
    history = [{"role": m.role, "content": m.content} for m in history_result.all()]

    user_msg = ChatMessage(document_id=document_id, role="user", content=payload.message)
    db.add(user_msg)
    await db.commit()

    answer = await llm_service.answer_followup(document.extracted_text, history, payload.message)

    assistant_msg = ChatMessage(document_id=document_id, role="assistant", content=answer)
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return assistant_msg


@router.get("/{document_id}/chat", response_model=list[ChatMessageResponse])
async def get_chat_history(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_document(document_id, db, current_user)
    result = await db.scalars(
        select(ChatMessage).where(ChatMessage.document_id == document_id).order_by(ChatMessage.created_at)
    )
    return result.all()


async def _get_owned_document(document_id: int, db: AsyncSession, current_user: User) -> Document:
    document = await db.get(Document, document_id)
    if document is None or document.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


async def _to_response(document: Document, db: AsyncSession) -> DocumentResponse:
    await db.refresh(document, attribute_names=["analysis"])
    analysis = None
    if document.analysis:
        analysis = AnalysisResponse(
            summary=document.analysis.summary,
            overall_risk=document.analysis.overall_risk,
            clauses=document.analysis.clauses_json,
            negotiation_tips=document.analysis.negotiation_tips_json,
        )
    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        doc_type=document.doc_type,
        status=document.status,
        error_message=document.error_message,
        created_at=document.created_at,
        analysis=analysis,
    )
