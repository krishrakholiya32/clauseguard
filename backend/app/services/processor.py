from app.core.database import async_session
from app.models.analysis import Analysis
from app.models.document import Document
from app.services import extraction, llm_service


async def process_document(document_id: int) -> None:
    async with async_session() as db:
        document = await db.get(Document, document_id)
        if document is None:
            return

        document.status = "processing"
        await db.commit()

        try:
            if extraction.is_pdf(document.storage_path):
                text, page_images = extraction.extract_pdf(document.storage_path)
                if text is None:
                    text = await llm_service.extract_text_from_images(page_images)
            else:
                image = extraction.load_image(document.storage_path)
                text = await llm_service.extract_text_from_images([image])

            document.extracted_text = text

            result = await llm_service.analyze_document(document.doc_type, text)

            analysis = Analysis(
                document_id=document.id,
                summary=result["summary"],
                overall_risk=result["overall_risk"],
                clauses_json=result["clauses"],
                negotiation_tips_json=result["negotiation_tips"],
            )
            db.add(analysis)
            document.status = "done"
            await db.commit()
        except Exception as exc:
            document.status = "failed"
            document.error_message = str(exc)
            await db.commit()
