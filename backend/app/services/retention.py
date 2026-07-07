import asyncio
import logging
import os
from datetime import datetime, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session
from app.models.document import Document

logger = logging.getLogger(__name__)

_CHECK_INTERVAL_SECONDS = 60 * 60 * 6  # re-check every 6 hours; retention_days doesn't need second-level precision


async def purge_expired_documents() -> int:
    cutoff = datetime.utcnow() - timedelta(days=settings.retention_days)
    async with async_session() as db:
        expired = (await db.scalars(select(Document).where(Document.created_at < cutoff))).all()
        for document in expired:
            if os.path.exists(document.storage_path):
                os.remove(document.storage_path)
            await db.delete(document)
        await db.commit()

    if expired:
        logger.info("retention: purged %d document(s) older than %d days", len(expired), settings.retention_days)
    return len(expired)


async def retention_loop() -> None:
    while True:
        try:
            await purge_expired_documents()
        except Exception:
            logger.exception("retention: purge run failed")
        await asyncio.sleep(_CHECK_INTERVAL_SECONDS)
