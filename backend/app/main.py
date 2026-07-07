import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, documents
from app.core.config import settings
from app.core.database import init_db
from app.services.retention import retention_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    retention_task = asyncio.create_task(retention_loop())
    yield
    retention_task.cancel()


app = FastAPI(title="ClauseGuard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve React frontend — must come last (catch-all)
_FRONTEND = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(_FRONTEND):
    app.mount("/assets", StaticFiles(directory=os.path.join(_FRONTEND, "assets")), name="assets")

    @app.get("/favicon.svg", include_in_schema=False)
    async def favicon():
        return FileResponse(os.path.join(_FRONTEND, "favicon.svg"), media_type="image/svg+xml")

    @app.get("/icons.svg", include_in_schema=False)
    async def icons():
        return FileResponse(os.path.join(_FRONTEND, "icons.svg"), media_type="image/svg+xml")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(_FRONTEND, "index.html"))
