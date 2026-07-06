from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# pool_pre_ping avoids "connection is closed" InterfaceErrors on the first
# request after Postgres or the OS silently drops an idle pooled connection
# (observed in production logs); pool_recycle proactively retires connections
# before they'd go stale in the first place.
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True, pool_recycle=1800)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
