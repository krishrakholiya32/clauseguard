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
    <img src="https://img.shields.io/badge/Groq-GPT--OSS_120B-F55036?style=flat" alt="Groq">
    <img src="https://img.shields.io/badge/Azure-deployed-0089D6?style=flat&logo=microsoftazure&logoColor=white" alt="Azure">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat" alt="License">
  </p>
</p>

---

<table>
  <tr>
    <td><img src="docs/screenshots/1-landing.png" alt="Landing page" width="100%"></td>
    <td><img src="docs/screenshots/4-upload.png" alt="Upload contract" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><em>Landing — hero, feature grid, how it works</em></td>
    <td align="center"><em>Upload — drag-and-drop, contract type selector</em></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/3-dashboard-with-doc.png" alt="Dashboard" width="100%"></td>
    <td><img src="docs/screenshots/5-analysis.png" alt="Analysis result" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><em>Dashboard — document list with risk badges</em></td>
    <td align="center"><em>Analysis — overall risk score + clause breakdown</em></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/6-clauses.png" alt="Clause cards" width="100%"></td>
    <td><img src="docs/screenshots/7-chat.png" alt="Negotiation tips and chat" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><em>Clauses — green/yellow/red risk cards with plain-English explanations</em></td>
    <td align="center"><em>Negotiation tips + document chat</em></td>
  </tr>
</table>

---

## Demo

![ClauseGuard Demo](docs/demo.gif)

Try it live at **[clauseguard.zrik.tech](https://clauseguard.zrik.tech)**

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
| 6 | **OCR Support** | Scanned PDFs and contract photos (JPEG/PNG) extracted via Gemini vision, with a Groq vision fallback |
| 7 | **12 Contract Types** | Rental, employment, loan, NDA, freelance, sale, insurance, partnership, vendor, consulting, software, other |
| 8 | **Per-User History** | All analyzed contracts saved to your account with full analysis, auto-deleted after 30 days |
| 9 | **Unbounded Gemini Key Rotation** | Any number of Gemini keys rotate automatically on rate limit (500 RPD per key) |
| 10 | **Groq Fallback** | GPT-OSS 120B via Groq kicks in if every Gemini key is exhausted, for both text and vision |
| 11 | **JWT Auth** | Signup / login with Argon2 password hashing; all document endpoints require auth |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.11+, async SQLAlchemy |
| **Database** | PostgreSQL (asyncpg) |
| **Primary LLM** | Google Gemini `gemini-3.1-flash-lite` — text analysis + vision OCR |
| **Fallback LLM** | Groq `openai/gpt-oss-120b` (text) + `qwen/qwen3.6-27b` (vision/OCR) |
| **PDF extraction** | PyMuPDF (text PDFs), Gemini vision + Groq vision fallback (scanned PDFs / photos) |
| **DOCX extraction** | python-docx |
| **Authentication** | JWT (PyJWT) + Argon2 (pwdlib) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 — white + indigo (#4F46E5) design system, Inter font |
| **Deployment** | Azure VM (Ubuntu, ARM64), systemd + Nginx + Let's Encrypt — FastAPI serves React build |

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
  │           ├─ Extract text (PyMuPDF / python-docx / Gemini OCR, Groq OCR fallback)
  │           ├─ Analyze: every configured Gemini key → every configured Groq key
  │           └─ Save analysis JSON to DB
  │
  ├─ GET  /documents        → List user's documents (auth required)
  ├─ GET  /documents/{id}   → Poll status + full analysis (auth required)
  ├─ DELETE /documents/{id} → Delete document (auth required)
  ├─ GET  /documents/{id}/chat → Chat history
  └─ POST /documents/{id}/chat → Ask a question (grounded in doc text)
        └─ answer_followup(): every configured Gemini key → every configured Groq key
```

**LLM Fallback Chain:**
- Text analysis and chat: all Gemini keys (primary + `GEMINI_API_KEYS` extras) → all Groq keys (primary + `GROQ_API_KEYS` extras). Unbounded — any number of backup keys per provider, not capped at one.
- OCR (scanned images): all Gemini keys → all Groq keys (`qwen/qwen3.6-27b`, vision-capable) — used to be Gemini-only with no fallback at all.
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
git clone https://github.com/krishrakholiya32/clauseguard.git
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
GEMINI_API_KEYS=second_key,third_key           # optional, comma-separated, unbounded
GEMINI_MODEL=gemini-3.1-flash-lite
GROQ_API_KEY=your_groq_api_key_here            # optional
GROQ_API_KEYS=second_key,third_key             # optional, comma-separated, unbounded
GROQ_MODEL=openai/gpt-oss-120b
GROQ_VISION_MODEL=qwen/qwen3.6-27b
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
| `GEMINI_API_KEYS` | No | Comma-separated backup Gemini keys — unbounded, all rotated in on rate limit |
| `GEMINI_MODEL` | No | Default: `gemini-3.1-flash-lite` (500 RPD free) |
| `GROQ_API_KEY` | No | Groq key — fallback after every Gemini key is exhausted |
| `GROQ_API_KEYS` | No | Comma-separated backup Groq keys — unbounded, all rotated in on rate limit |
| `GROQ_MODEL` | No | Default: `openai/gpt-oss-120b` (text) |
| `GROQ_VISION_MODEL` | No | Default: `qwen/qwen3.6-27b` (OCR fallback) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (not needed in production — same-origin, FastAPI serves the built React app directly) |

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
│   └── .env.production           # VITE_API_URL= (empty → relative URLs, same-origin)
├── docs/
│   └── screenshots/
├── requirements.txt              # -r backend/requirements.txt
├── docker-compose.yml
└── README.md
```

---

## Deployment (Azure)

Runs on an **Azure for Students** VM (`Standard_B2pts_v2`, ARM64, 2 vCPU / 1GB RAM), Ubuntu
24.04 — shares the box with CaReSale, each as its own systemd service behind a shared Nginx.

```
systemd: uvicorn app.main:app --host 127.0.0.1 --port 8003
Nginx:   reverse proxy clauseguard.zrik.tech → 127.0.0.1:8003, SSL via Let's Encrypt
```

FastAPI mounts `/assets` as `StaticFiles` and serves `frontend/dist/index.html` via a catch-all route for all non-API paths — same pattern as before, just proxied through Nginx instead of Heroku's router.

### Deploy your own

```bash
# On the server: clone, install, build
git clone https://github.com/krishrakholiya32/clauseguard.git
cd clauseguard/backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd ../frontend && npm install && npm run build

# Postgres (local, same box or elsewhere)
sudo -u postgres psql -c "CREATE USER clauseguard WITH PASSWORD 'yourpass';"
sudo -u postgres psql -c "CREATE DATABASE clauseguard OWNER clauseguard;"

# backend/.env
DATABASE_URL=postgresql+asyncpg://clauseguard:yourpass@localhost:5432/clauseguard
JWT_SECRET=$(openssl rand -hex 32)
GEMINI_API_KEY=your_key_here
GEMINI_API_KEYS=your_second_key_here,your_third_key_here
GROQ_API_KEY=your_groq_key_here
GROQ_API_KEYS=your_second_groq_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_VISION_MODEL=qwen/qwen3.6-27b
CORS_ORIGINS=https://your-domain.com
```

Then a systemd unit (`ExecStart=.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8003`),
an Nginx server block reverse-proxying to that port, and `sudo certbot --nginx -d your-domain.com`
for SSL.

---

## Roadmap

- [ ] S3/Cloudflare R2 for persistent uploaded file storage (currently on local VM disk)
- [ ] Streaming analysis results via SSE (instead of polling)
- [ ] Side-by-side clause comparison between two contract versions
- [ ] Export analysis as PDF summary
- [ ] Team accounts — share analysis with colleagues

---

## License

[MIT](LICENSE)

---

<p align="center">
  Designed and built from scratch with FastAPI · React · Gemini · Groq · Deployed on Azure
</p>
