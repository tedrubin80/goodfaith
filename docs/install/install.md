# Local install

Run the full stack on your machine with Docker Compose.

## Requirements

- Docker Desktop (or Docker Engine + Compose v2)
- ~4 GB free RAM for Postgres, Redis, API, Celery, and Next.js

## 1. Clone and configure

```bash
git clone https://github.com/tedrubin80/goodfaith.git
cd goodfaith
cp backend/.env.example backend/.env
```

Edit `backend/.env` only if you need custom hosts; defaults work for local Compose.

## 2. Start services

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Install homepage / portal | http://localhost:3020 |
| API | http://localhost:8020 |
| Health | http://localhost:8020/api/health/ |

The portal root (`/`) is a local install welcome page with live health checks — not a SaaS marketing site.

## 3. Seed a label

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'changeme' \
  --demo
```

Sign in at http://localhost:3020/login.

## 4. Day-to-day

```bash
docker compose up          # start
docker compose down        # stop (keeps volumes)
docker compose down -v     # stop and wipe DB / media
```

## Production-ish local stack

```bash
cp backend/.env.production.example backend/.env
# Set DJANGO_SECRET_KEY, POSTGRES_PASSWORD, ALLOWED_HOSTS, CORS
docker compose -f docker-compose.prod.yml up --build -d
```

See [technical.md](./technical.md) for environment variables and [PHASE1.md](../PHASE1.md) for the royalty walkthrough.
