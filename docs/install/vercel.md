# Deploy the portal on Vercel

The Next.js app in `frontend/` is the install homepage + authenticated portal. Host it on Vercel; keep the Django API on Railway (or Docker).

## Template file

[`frontend/vercel.json`](../../frontend/vercel.json) — framework, build, and security headers.

## 1. Create the Vercel project

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend` (required for this monorepo).
3. Framework Preset: **Next.js** (auto-detected).
4. Vercel will pick up `frontend/vercel.json`.

## 2. Environment variables

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your public API origin, e.g. `https://goodfaith-api.up.railway.app` |

No trailing slash. Redeploy after changing it (it is inlined at build time).

## 3. Wire CORS on the API

On Railway (or wherever the API runs), add the Vercel URL to:

```text
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
DJANGO_ALLOWED_HOSTS=…   # API hosts only
```

Include preview URLs if you use them, or a wildcard pattern your API settings allow.

## 4. Deploy

Push to `main` or click **Deploy**. The site root (`/`) shows the local/install welcome UI and polls `NEXT_PUBLIC_API_URL/api/health/`.

Sign-in: `https://your-app.vercel.app/login`.

## Checklist

- [ ] Root Directory = `frontend`
- [ ] `NEXT_PUBLIC_API_URL` set and rebuild complete
- [ ] API `CORS_ALLOWED_ORIGINS` includes the Vercel domain
- [ ] API is reachable over HTTPS from the browser
- [ ] Label seeded on the API (`seed_label`) so you can log in

## Notes

- Vercel only runs the portal. Statement parsing and Celery stay on Railway.
- Media uploads go to the API (`MEDIA_ROOT` or S3/R2) — not to Vercel blob storage unless you add that later.
- For a fully local stack, use [install.md](./install.md) instead.
