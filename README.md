<p align="center">
  <h1 align="center">ClauseGuard</h1>
  <p align="center"><strong>AI Contract Analysis for Everyone</strong></p>
  <p align="center">
    Upload any contract — AI reads every clause, flags the risky parts, and tells you exactly what to push back on. In plain English. In seconds.
  </p>
  <p align="center">
    <a href="https://clauseguard.zrik.tech">
      <img src="https://img.shields.io/badge/Live%20Demo-clauseguard.zrik.tech-brightgreen?style=for-the-badge" alt="Live Demo">
    </a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Gemini-3.1_Flash_Lite-4285F4?style=flat&logo=google&logoColor=white" alt="Gemini">
    <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat" alt="Groq">
    <img src="https://img.shields.io/badge/Heroku-deployed-430098?style=flat&logo=heroku&logoColor=white" alt="Heroku">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat" alt="License">
  </p>
</p>

---

<table>
  <tr>
    <td><img src="docs/screenshots/1-landing.png" alt="Landing page" width="100%"></td>
    <td><img src="docs/screenshots/2-upload.png" alt="Upload contract" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><em>Landing — hero, feature grid, how it works</em></td>
    <td align="center"><em>Upload — drag-and-drop, contract type selector</em></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/3-analysis.png" alt="Analysis result" width="100%"></td>
    <td><img src="docs/screenshots/4-chat.png" alt="Document chat" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><em>Analysis — overall risk, clause-by-clause breakdown</em></td>
    <td align="center"><em>Chat — ask any question about the contract</em></td>
  </tr>
</table>

---

## Why I Built This

Most people sign contracts they don't fully understand — rental agreements with one-sided clauses, employment contracts with overreaching IP assignments, loan documents with hidden penalties. Legal review is expensive and slow. ClauseGuard was built to fix that: upload any contract and get an instant, grounded analysis tailored to Indian legal conventions. The project explores async document processing, multi-provider LLM fallback chains, and RAG-style document-grounded chat — all in a polished single-dyno deployment.

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Plain-English Breakdown** | Every clause translated from legalese — no law degree required |
| 2 | **Green / Yellow / Red Risk Flags** | Instant visual risk scoring per clause with clear explanations |
| 3 | **Overall Risk Score** | Document-level risk summary with a 2–4 sentence overview |
| 4 | **Negotiation Tips** | Concrete, actionable suggestions on what to push back on |
| 5 | **Document Chat** | Ask follow-up questions grounded in your specific contract |
| 6 | **OCR Support** | Scanned PDFs and contract photos (JPEG/PNG) extracted via Gemini vision |
| 7 | **12 Contract Types** | Rental, employment, loan, NDA, freelance, sale, insurance, partnership, vendor, consulting, software, other |
| 8 | **Per-User History** | All analyzed contracts saved to your account with full analysis |
| 9 | **Dual Gemini Key Rotation** | Automatic key rotation on rate limit (500 RPD × 2 keys) |
| 10 | **Groq Fallback** | LLaMA 3.3 70B via Groq kicks in if both Gemini keys are exhausted |
| 11 | **JWT Auth** | Signup / login with bcrypt password hashing; all document endpoints require auth |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.11+, async SQLAlchemy |
| **Database** | PostgreSQL (asyncpg) |
| **Primary LLM** | Google Gemini `gemini-3.1-flash-lite` — text analysis + vision OCR |
| **Fallback LLM** | Groq `llama-3.3-70b-versatile` — text analysis + chat |
| **PDF extraction** | PyMuPDF (text PDFs), Gemini vision (scanned PDFs / photos) |
| **DOCX extraction** | python-docx |
| **Authentication** | JWT (python-jose) + bcrypt (passlib) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 — white + indigo (#4F46E5) design system, Inter font |
| **Deployment** | Heroku (eco dyno, single process — FastAPI serves React build) |

---

## Architecture

```
Browser
  │
  ├─ GET /                  → FastAPI catch-all → frontend/dist/index.html
  ├─ GET /assets/*          → Vite build assets (StaticFiles)
  │
  ├─ POST /auth/signup      → Create account, returns JWT
  ├─ POST /auth/login       → Login, returns JWT
  │
  ├─ POST /documents/upload → Save file, kick off BackgroundTask
  │     └─ process_document(doc_id)
  │           ├─ Extract text (PyMuPDF / python-docx / Gemini OCR)
  │           ├─ Analyze: Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2
  │           └─ Save analysis JSON to DB
  │
  ├─ GET  /documents        → List user's documents (auth required)
  ├─ GET  /documents/{id}   → Poll status + full analysis (auth required)
  ├─ DELETE /documents/{id} → Delete document (auth required)
  ├─ GET  /documents/{id}/chat → Chat history
  └─ POST /documents/{id}/chat → Ask a question (grounded in doc text)
        └─ answer_followup(): Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2
```

**LLM Fallback Chain:**
- Text analysis and chat: Gemini key 1 → Gemini key 2 → Groq key 1 → Groq key 2
- OCR (scanned images): Gemini only (needs vision capability)
- Rate-limit detection: catches `ResourceExhausted`, HTTP 429, "quota" strings

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (or use Docker Compose)
- [Gemini API key](https://aistudio.google.com/apikey) (free tier — use `gemini-3.1-flash-lite`)
- [Groq API key](https://console.groq.com/keys) (optional, for fallback)

### 1. Clone

```bash
git clone https://github.com/zrik/clauseguard.git
cd clauseguard
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://clauseguard:clauseguard@localhost:5432/clauseguard
JWT_SECRET=change-me-to-a-random-secret
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_2=your_second_gemini_key_here   # optional
GEMINI_MODEL=gemini-3.1-flash-lite
GROQ_API_KEY=your_groq_api_key_here            # optional
GROQ_API_KEY_2=your_second_groq_key_here       # optional
```

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: <http://localhost:5173>
- API docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>

### Docker Compose (alternative)

```bash
cp .env.example .env
# Fill in GEMINI_API_KEY and JWT_SECRET
docker compose up --build
```

Open <http://localhost> — nginx proxies API calls to the FastAPI backend.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `JWT_SECRET` | Yes | Random secret for JWT signing — `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Yes | Primary Gemini API key — text analysis + OCR |
| `GEMINI_API_KEY_2` | No | Second Gemini key — rotated in on rate limit |
| `GEMINI_MODEL` | No | Default: `gemini-3.1-flash-lite` (500 RPD free) |
| `GROQ_API_KEY` | No | Groq key — fallback after both Gemini keys are exhausted |
| `GROQ_API_KEY_2` | No | Second Groq key — rotated in on Groq rate limit |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (not needed on Heroku — same-origin) |

> **Gemini model note:** Use `gemini-3.1-flash-lite`. Other models like `gemini-2.0-flash` may have zero free-tier quota — check the Rate Limits tab in AI Studio if you get 429 errors.

---

## API Reference

All `/documents/*` endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account. Body: `{"email", "password"}` → `{"access_token"}` |
| `POST` | `/auth/login` | Login. Body: `{"email", "password"}` → `{"access_token"}` |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/documents/upload` 🔒 | Upload contract. Form: `file` + `doc_type` |
| `GET`    | `/documents` 🔒 | List all documents for the authenticated user |
| `GET`    | `/documents/{id}` 🔒 | Get document + full analysis (poll until `status: "done"`) |
| `DELETE` | `/documents/{id}` 🔒 | Delete document and its analysis |
| `GET`    | `/documents/{id}/chat` 🔒 | Get chat history for a document |
| `POST`   | `/documents/{id}/chat` 🔒 | Ask a question. Body: `{"message": "..."}` |

**Supported `doc_type` values:** `rental`, `employment`, `loan`, `freelance`, `nda`, `sale`, `insurance`, `partnership`, `vendor`, `consulting`, `software`, `other`

**Supported file types:** `.pdf`, `.png`, `.jpg`, `.jpeg`, `.docx`

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |

---

## Project Structure

```
clauseguard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py           # JWT auth — signup, login
│   │   │   └── documents.py      # Upload, list, get, delete, chat endpoints
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic settings — env vars + validators
│   │   │   ├── database.py       # Async SQLAlchemy engine + init_db
│   │   │   └── deps.py           # get_current_user dependency
│   │   ├── models/
│   │   │   ├── user.py           # User ORM model
│   │   │   ├── document.py       # Document ORM model
│   │   │   ├── analysis.py       # Analysis ORM model (JSON clauses)
│   │   │   └── chat_message.py   # ChatMessage ORM model
│   │   ├── schemas/
│   │   │   └── document.py       # Pydantic response schemas
│   │   ├── services/
│   │   │   ├── llm_service.py    # Gemini + Groq fallback chain — analyze, chat, OCR
│   │   │   ├── processor.py      # Background task — extract text + trigger analysis
│   │   │   └── redflags.py       # Per-doc-type risk checklist for the LLM prompt
│   │   └── main.py               # FastAPI app, CORS, static mounts, catch-all SPA route
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # Axios client — JWT interceptor, 401 auto-logout
│   │   ├── auth/
│   │   │   └── AuthContext.tsx   # React context — login, signup, logout, token state
│   │   ├── components/
│   │   │   ├── ChatBox.tsx       # Chat UI — message bubbles, typing indicator, error recovery
│   │   │   ├── ClauseCard.tsx    # Single clause — colored border, plain English, risk badge
│   │   │   ├── DisclaimerBanner.tsx  # "Not legal advice" amber banner
│   │   │   └── RiskBadge.tsx     # Green / yellow / red pill badge
│   │   ├── pages/
│   │   │   ├── Landing.tsx       # Public landing — hero, features, how-it-works, CTA
│   │   │   ├── Login.tsx         # Auth — login form
│   │   │   ├── Signup.tsx        # Auth — signup form
│   │   │   ├── Dashboard.tsx     # Document list — skeleton, empty state, delete on hover
│   │   │   ├── Upload.tsx        # Upload — drag-and-drop, contract type selector
│   │   │   └── DocumentResult.tsx # Analysis view — polling, clause cards, chat
│   │   ├── App.tsx               # Router, Nav, ProtectedRoute
│   │   └── index.css             # Inter font, Tailwind v4, marquee animation
│   └── .env.production           # VITE_API_URL= (empty → relative URLs on Heroku)
├── docs/
│   └── screenshots/
├── Procfile                      # web: sh -c 'cd backend && uvicorn ...'
├── .python-version               # 3.11 (Heroku buildpack)
├── requirements.txt              # -r backend/requirements.txt (Heroku root requirement)
├── docker-compose.yml
└── README.md
```

---

## Deployment (Heroku)

The app runs as a **single Heroku dyno** — FastAPI serves both the API and the React build:

```
Procfile:  web: sh -c 'cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
```

FastAPI mounts `/assets` as `StaticFiles` and serves `frontend/dist/index.html` via a catch-all route for all non-API paths.

### Deploy your own

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0

heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set GEMINI_API_KEY=your_key_here
heroku config:set GEMINI_API_KEY_2=your_second_key_here
heroku config:set GROQ_API_KEY=your_groq_key_here

# Build frontend first
cd frontend && npm run build && cd ..
git add -f frontend/dist/
git commit -m "build: production frontend"
git push heroku main
```

Custom domain + SSL:
```bash
heroku domains:add clauseguard.yourdomain.com
heroku certs:auto:enable
# Add CNAME in your DNS provider pointing to the Heroku DNS target shown
```

---

## Roadmap

- [ ] S3/Cloudflare R2 for persistent uploaded file storage (Heroku storage is ephemeral)
- [ ] Streaming analysis results via SSE (instead of polling)
- [ ] Side-by-side clause comparison between two contract versions
- [ ] Export analysis as PDF summary
- [ ] Team accounts — share analysis with colleagues

---

## License

[MIT](LICENSE)

---

<p align="center">
  Designed and built from scratch with FastAPI · React · Gemini · Groq · Deployed on Heroku
</p>
