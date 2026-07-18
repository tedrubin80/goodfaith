# Deploy the API on Railway

Run Django + PostgreSQL + Redis + Celery on Railway. Pair with [Vercel](./vercel.md) for the portal.

## Template files

| File | Use |
|---|---|
| [`railway.toml`](../../railway.toml) | API service when **Root Directory** is the repo root |
| [`railway.worker.toml`](../../railway.worker.toml) | Celery worker (repo root) |
| [`backend/railway.toml`](../../backend/railway.toml) | API when **Root Directory** = `backend` |
| [`backend/railway.worker.toml`](../../backend/railway.worker.toml) | Celery when Root Directory = `backend` |

## Architecture

```
Vercel (Next.js)  →  Railway API (Gunicorn)
                         ├─ PostgreSQL
                         ├─ Redis
                         └─ Celery worker (same image, different start command)
```

## 1. Create the project

1. New Project on [Railway](https://railway.app).
2. **Add PostgreSQL** and **Add Redis** from the canvas.
3. **New Service** → GitHub Repo → this repository.

### Option A — Root Directory = `backend` (recommended)

1. Service settings → **Root Directory** = `backend`.
2. Railway uses `backend/Dockerfile` + `backend/railway.toml`.
3. Generate a public domain for the API service.

### Option B — Root Directory = repo root

1. Leave root empty; Railway uses root `railway.toml` (`dockerfilePath = backend/Dockerfile`).
2. Generate a public domain.

## 2. Environment variables (API service)

Link variables from Postgres/Redis, then set:

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | Long random string |
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` |
| `DATABASE_URL` | Reference from Postgres plugin |
| `CELERY_BROKER_URL` | Redis URL (Railway Redis `REDIS_URL` or `${{Redis.REDIS_URL}}`) |
| `CELERY_RESULT_BACKEND` | Same Redis URL |
| `DJANGO_CACHE_URL` | Same Redis URL (or `/1` DB index) |
| `DJANGO_ALLOWED_HOSTS` | Your Railway domain, e.g. `goodfaith-api.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel origin, e.g. `https://your-app.vercel.app` |
| `DJANGO_SECURE_SSL_REDIRECT` | `True` |
| `DJANGO_SESSION_COOKIE_SECURE` | `True` |
| `DJANGO_CSRF_COOKIE_SECURE` | `True` |

See `backend/.env.production.example` for a full checklist.

If Railway only provides `REDIS_URL`, map it:

```text
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}
DJANGO_CACHE_URL=${{Redis.REDIS_URL}}
```

## 3. Celery worker service

1. **New Service** → same GitHub repo.
2. Same Root Directory as the API (`backend` or repo root).
3. Set **Custom Start Command** from `railway.worker.toml`:

```bash
celery -A config worker -l info --concurrency=2
```

4. Copy the same env vars as the API (no public domain required).

Health checks on `/api/health/` will show `celery: true` once the worker responds to ping.

## 4. Seed a label

From Railway’s API service shell / one-off run:

```bash
python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'choose-a-strong-password' \
  --demo
```

## 5. Connect Vercel

Set `NEXT_PUBLIC_API_URL` on Vercel to `https://<your-railway-api-domain>` and redeploy. Confirm CORS includes the Vercel URL.

## Checklist

- [ ] Postgres + Redis attached
- [ ] API service deployed with public HTTPS domain
- [ ] Celery worker running
- [ ] `/api/health/` returns `ok` (or `degraded` only until worker is up)
- [ ] `CORS_ALLOWED_ORIGINS` matches Vercel
- [ ] `seed_label` completed
- [ ] Portal can sign in

## Optional: S3 / R2

For statement and DAM uploads in production, set `AWS_*` vars (see technical.md). Without them, files use container disk (ephemeral on Railway unless you attach a volume).
