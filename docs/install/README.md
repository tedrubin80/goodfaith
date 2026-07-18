# Install Good Faith

Open-source, self-hosted record label management. Pick a path:

| Guide | When to use |
|---|---|
| [Local install](./install.md) | Docker Compose on your machine |
| [Technical overview](./technical.md) | Architecture, env vars, services |
| [Railway](./railway.md) | API + Postgres + Redis + Celery |
| [Vercel](./vercel.md) | Next.js portal (pairs with Railway) |

**Recommended cloud split:** Railway for the Django API stack, Vercel for the portal.

Templates in the repo:

- `frontend/vercel.json` — Vercel project config (Root Directory = `frontend`)
- `railway.toml` / `railway.worker.toml` — Railway API + Celery (repo root)
- `backend/railway.toml` / `backend/railway.worker.toml` — same, when Root Directory = `backend`
