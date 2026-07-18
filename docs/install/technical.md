# Technical overview

## Stack

| Layer | Technology |
|---|---|
| Portal | Next.js 16 (TypeScript) in `frontend/` |
| API | Django 6 + Django REST Framework in `backend/` |
| Database | PostgreSQL 16 |
| Queue / cache | Redis 7 + Celery worker |
| Object storage | Local `MEDIA_ROOT` (dev) or S3/R2 (optional prod) |

There is **no SaaS subscription billing**. Artist royalty payouts use mark-paid + ACH CSV export inside the Payments module.

## Processes

```
Browser → Next.js portal (:3020)
              ↓ NEXT_PUBLIC_API_URL
         Django API (:8020)
              ↓
     PostgreSQL   Redis ← Celery worker
```

Background work (statement parsing, etc.) runs on Celery. The API health endpoint reports DB + Celery ping:

`GET /api/health/` → `{ "status": "ok"|"degraded", "checks": { "database", "celery" } }`

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret (required in prod) |
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` or `config.settings.prod` |
| `DATABASE_URL` | Postgres URL |
| `CELERY_BROKER_URL` | Redis URL for Celery |
| `CELERY_RESULT_BACKEND` | Redis URL for results |
| `DJANGO_CACHE_URL` | Redis cache (2FA pending tokens) |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Comma-separated portal origins (include Vercel URL) |
| `AWS_*` | Optional S3/R2 for uploads |

Templates: `backend/.env.example`, `backend/.env.production.example`.

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Absolute API origin, e.g. `https://api.example.com` (no trailing slash) |

## Auth & roles

Token auth (+ optional TOTP 2FA). Roles: `artist`, `manager`, `finance`, `ar`, `admin`. Manager/Finance/Admin must enable 2FA before financial APIs.

Bootstrap without Django admin:

```bash
python manage.py seed_label --label-name "…" --manager-username … --manager-password … [--demo]
```

## Repo map

| Path | Role |
|---|---|
| `backend/` | API, Celery, migrations |
| `frontend/` | Portal + install homepage |
| `marketing/` | Optional static project site (Astro) |
| `docs/install/` | Install guides |
| `frontend/vercel.json` | Vercel template |
| `railway.toml` | Railway API template |
| `railway.worker.toml` | Railway Celery template |

## Deploy templates

- **Vercel** → portal only ([vercel.md](./vercel.md))
- **Railway** → API + DB + Redis + worker ([railway.md](./railway.md))
- **Docker Compose** → all-in-one ([install.md](./install.md))
