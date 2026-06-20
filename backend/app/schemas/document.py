from datetime import datetime

from pydantic import BaseModel


class ClauseItem(BaseModel):
    text: str
    plain_english: str
    risk: str
    reason: str


class AnalysisResponse(BaseModel):
    summary: str
    overall_risk: str
    clauses: list[ClauseItem]
    negotiation_tips: list[str]


class DocumentResponse(BaseModel):
    id: int
    filename: str
    doc_type: str
    status: str
    error_message: str | None
    created_at: datetime
    analysis: AnalysisResponse | None = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
