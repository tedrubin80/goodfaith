# Good Faith — DevWeb

Developer / project showcase site for **Good Faith Record Management**.

This folder is intentionally self-contained so you can move it to its own repo later without dragging the Django/Next app along.

## What this is

A static Astro site that explains the product to developers and operators:

- Feature overview of shipped modules
- Stack (Django, Next.js, Postgres, Celery, Railway/Vercel)
- Role-based access (Gap 5)
- Local install + deploy doc links
- GitHub CTAs (MIT / open source — no SaaS pricing)

## Run locally

```bash
cd DevWeb
npm install
npm run dev
```

→ http://localhost:4321

```bash
npm run build    # → dist/
npm run preview
```

## Extract to a new repo

When you’re ready:

```bash
# from monorepo root
mkdir -p ../goodfaith-site
cp -R DevWeb/. ../goodfaith-site/
cd ../goodfaith-site
git init
# push to a new GitHub repo; deploy dist/ to any static host or Vercel/Netlify
```

Point GitHub links in components at the product repo (`tedrubin80/goodfaith`) or update them after the split.

Deploy: set the Vercel project root to this folder (uses `vercel.json`), or serve `dist/` from any static host.

## Relation to other folders

| Path | Purpose |
|---|---|
| `DevWeb/` | **This site** — developer showcase |
| `frontend/` | Authenticated portal + local install homepage |
| `backend/apps/marketing/` | In-app marketing *campaigns* module (unrelated) |
