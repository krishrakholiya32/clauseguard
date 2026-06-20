# ClauseGuard

Upload a contract (rental agreement, employment offer, loan document — PDF or photo) and get a plain-English, clause-by-clause breakdown with risk flags (green/yellow/red) and negotiation suggestions, tailored to Indian legal conventions. Includes a follow-up chat to ask questions about the uploaded document.

**Not legal advice** — informational only; always consult a qualified lawyer for anything important.

## Stack

- **Backend**: FastAPI, async SQLAlchemy + PostgreSQL, JWT auth
- **AI**: Google Gemini (vision + text) for OCR and clause analysis — no model training, no separate vector DB (large context window means the whole document is sent directly)
- **Extraction**: PyMuPDF for text-based PDFs; Gemini vision for scanned PDFs/photos
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Deploy**: Docker Compose → Oracle Cloud Always Free ARM VM (see `DEPLOY.md`)

## Local development

Backend:
```bash
cd backend
pip install -r requirements.txt
# requires a running Postgres + GEMINI_API_KEY env var, see .env.example
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Full stack via Docker:
```bash
cp .env.example .env   # fill in JWT_SECRET and GEMINI_API_KEY
docker compose up --build
```

## Deploying for real use

See `DEPLOY.md` for step-by-step Oracle Cloud Always Free deployment.
