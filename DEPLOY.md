# Deployment Guide — Oracle Cloud Always Free Tier

## Why Oracle Cloud Always Free?

| Resource | Free Amount |
|---|---|
| Arm A1 VM (Ampere) | **4 OCPUs + 24 GB RAM** — never expires |
| Block Storage | 200 GB |
| Outbound data | 10 TB/month |

CPU-only is fine here — ClauseGuard does no local model inference; all AI work happens via the Gemini API.

---

## Step 1 — Create the ARM VM

1. OCI Console → **Compute → Instances → Create Instance**
2. **Name**: `clauseguard-server`
3. **Image**: Ubuntu 22.04 (Always Free eligible)
4. **Shape**: Change → **Ampere → VM.Standard.A1.Flex** (2 OCPU / 8 GB RAM is plenty for this app; up to 4/24 free)
5. **SSH Keys**: upload your public key
6. **Boot Volume**: default is fine
7. Create, note the **Public IP**

---

## Step 2 — Open ports

This deployment is accessed by raw IP over plain HTTP (no domain/TLS).

1. Instance → **Subnet** → **Security List** → Ingress Rules → add:
   | Protocol | Port | Source | Description |
   |---|---|---|---|
   | TCP | 22 | your IP only | SSH |
   | TCP | 80 | `0.0.0.0/0` (or your IP) | HTTP |
2. On the VM itself:
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

---

## Step 3 — Install Docker

```bash
ssh ubuntu@YOUR_VM_IP
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install -y docker-compose-plugin
docker compose version
```

---

## Step 4 — Get the code onto the VM

```bash
git clone https://github.com/YOUR_USERNAME/ClauseGuard.git ~/clauseguard
cd ~/clauseguard
```

---

## Step 5 — Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in:
```env
JWT_SECRET=<output of: openssl rand -hex 32>
GEMINI_API_KEY=<your Gemini API key from aistudio.google.com>
GEMINI_MODEL=gemini-3.1-flash-lite
```

Get a free Gemini API key at https://aistudio.google.com/apikey — the free tier is generous enough for personal/small-scale real use.

---

## Step 6 — Build and launch

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend
```

Expected:
```
NAME       STATUS    PORTS
postgres   running   5432/tcp
backend    running   8000/tcp
frontend   running   0.0.0.0:80->80/tcp
```

---

## Step 7 — Use it

Open `http://YOUR_VM_IP` in a browser → sign up → upload a contract (PDF or photo) → wait for analysis → review the clause breakdown and chat with the document.

---

## Maintenance

```bash
# Logs
docker compose logs -f backend

# Update and redeploy
git pull && docker compose build && docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U clauseguard clauseguard > backup.sql

# Resource usage
docker stats
```

## Notes on scale and cost

- No vector DB/queue is running — background processing is in-process `asyncio` tasks tracked via the `documents.status` column. This comfortably handles a handful of concurrent uploads on a 2-4 OCPU VM; if usage grows much beyond that, consider moving to Celery+Redis.
- Gemini API usage is the main ongoing cost driver — monitor usage at https://aistudio.google.com if you exceed the free tier.
- There's no TLS/domain in this setup; keep the security-list ingress rules scoped down if the app will hold real users' real documents.

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend fails to start | `docker compose logs backend` — usually a missing `GEMINI_API_KEY`/`JWT_SECRET` in `.env`, or DB not ready yet |
| Uploads stuck on "Analyzing..." | Check backend logs for Gemini API errors (bad key, rate limit, or quota exceeded) |
| Can't reach the site | Check OCI Security List AND VM iptables rules for port 80 |
| 401 on every request after restart | `JWT_SECRET` changed — users need to log in again |
