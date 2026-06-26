# ClauseGuard

Upload a contract (rental agreement, employment offer, loan document, NDA, and more) and get a plain-English, clause-by-clause breakdown with green/yellow/red risk flags and negotiation suggestions — tailored to Indian legal conventions. Includes a follow-up chat to ask questions about your specific document.

**Not legal advice** — informational only. Always consult a qualified lawyer for anything important.

## Features

- PDF upload (text-based and scanned) and photo upload (JPEG/PNG)
- DOCX support
- Clause-by-clause risk analysis (green / yellow / red)
- Overall risk score and summary
- Negotiation tips per clause
- Follow-up chat grounded in the uploaded document
- Full document history per user account
- JWT auth (signup / login)
- Dockerized stack — one command to run

## Tech stack

| Layer | Technology |
|---|---|
| AI | Google Gemini (vision + text) — OCR, clause extraction, risk analysis, chat |
| PDF extraction | PyMuPDF (text PDFs) + Gemini vision (scanned PDFs / photos) |
| Backend | FastAPI, async SQLAlchemy, PostgreSQL, JWT auth |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Infra | Docker Compose, Nginx (built into the frontend image) |

No local model inference — all AI runs via the Gemini API, so CPU-only hosting is fine.

## Architecture

```
browser
  └── nginx :80  (inside frontend container)
        ├── /auth/*       → FastAPI backend :8000
        ├── /documents/*  → FastAPI backend :8000
        ├── /health       → FastAPI backend :8000
        └── /*            → React SPA

backend
  ├── POST /auth/signup
  ├── POST /auth/login
  ├── POST /documents/upload         — extract text, trigger async Gemini analysis
  ├── GET  /documents                — list user's documents
  ├── GET  /documents/{id}           — get document + analysis result
  ├── POST /documents/{id}/chat      — ask a question about the document
  ├── DELETE /documents/{id}         — delete document
  └── GET  /health
```

## Quick start (Docker)

### Prerequisites

- Docker Desktop (or Docker + Docker Compose v2)
- A free Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey)

```bash
git clone https://github.com/krishrakholiya32/clauseguard.git
cd clauseguard

cp .env.example .env
# Edit .env — fill in JWT_SECRET and GEMINI_API_KEY (see below)

docker compose up --build
```

Open **http://localhost** in your browser, sign up, and upload a contract.

### `.env` configuration

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Long random string — `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Yes | From [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free tier) |
| `GEMINI_MODEL` | No | Default: `gemini-3.1-flash-lite` — has free-tier quota |

**Gemini model note**: Use `gemini-3.1-flash-lite` (the default). Other models like `gemini-2.0-flash` may have zero free-tier quota on your account — check the Rate Limits tab in AI Studio if you get 429 errors.

## API reference

All `/documents/*` endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create account. Body: `{"email","password"}` |
| `POST` | `/auth/login` | Login. Body: `{"email","password"}` → `{"access_token"}` |
| `POST` | `/documents/upload` | Upload contract. Form: `file` + `doc_type` (see below) |
| `GET` | `/documents` | List all documents for the authenticated user |
| `GET` | `/documents/{id}` | Get document + full analysis result |
| `POST` | `/documents/{id}/chat` | Ask a question. Body: `{"message":"..."}` |
| `DELETE` | `/documents/{id}` | Delete document and its data |
| `GET` | `/health` | Health check |

**Supported `doc_type` values**: `rental`, `employment`, `loan`, `freelance`, `nda`, `sale`, `insurance`, `partnership`, `vendor`, `consulting`, `software`, `other`

**Supported file types**: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.docx`

### Example

```bash
# Signup
curl -X POST http://localhost/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}'

# Upload a contract
curl -X POST http://localhost/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@rental_agreement.pdf" \
  -F "doc_type=rental"
# → {"id":1,"status":"pending",...}

# Poll until done
curl http://localhost/documents/1 \
  -H "Authorization: Bearer <token>"
# → {"status":"done","analysis":{"overall_risk":"red","clauses":[...],...}}

# Ask a follow-up question
curl -X POST http://localhost/documents/1/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the notice period I need to give?"}'
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions to deploy on Oracle Cloud Always Free (ARM A1 VM, no expiry).

## License

MIT — see [LICENSE](LICENSE).
