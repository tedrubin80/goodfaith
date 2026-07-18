# Good Faith Record Management

**Open-source, self-hosted label management** for indie labels outgrowing spreadsheets.

Consolidate royalty statements from every distributor you already use. Run splits and payouts with role-based portals. Export everything anytime. **No cut of your earnings. No SaaS subscription billing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![CI](https://github.com/tedrubin80/goodfaith/actions/workflows/ci.yml/badge.svg)](https://github.com/tedrubin80/goodfaith/actions/workflows/ci.yml)

---

## Why it exists

Indie labels (roughly 5–50 artists) live in Google Sheets until multi-distributor royalties break the spreadsheet. Existing tools either force a distributor switch, take a percentage of earnings, or are scoped for DIY solo artists or enterprise teams.

Good Faith is the mid-market ops stack you run **yourself**.

### What you get

| Capability | What it means |
|---|---|
| **Distributor-agnostic royalties** | Ingest DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, Vydia, The Orchard |
| **Splits → runs → payouts** | Finalize 100% sheets, consolidate statements, mark paid / export ACH CSV |
| **Role-based portals** | Artist / Manager / Finance / A&R — finance data stays off A&R desks |
| **Catalog & rights** | Artists, releases, tracks (ISRC/ISWC/UPC), contracts, publishing works |
| **Ops modules** | A&R pipeline, sync licensing, marketing campaigns, analytics, export, audit |
| **Trust defaults** | 2FA for financial roles, immutable activity log, full JSON/CSV export |

---

## Quick start (local)

```bash
git clone https://github.com/tedrubin80/goodfaith.git
cd goodfaith
cp backend/.env.example backend/.env
docker compose up --build
```

| | URL |
|---|---|
| Portal (`/` → login) | http://localhost:3020 |
| Install / health page | http://localhost:3020/install |
| API | http://localhost:8020 |
| Health | http://localhost:8020/api/health/ |

Seed a label and sign in:

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'changeme' \
  --demo
```

→ http://localhost:3020/login

---

## Deploy

| Target | Role | Guide / template |
|---|---|---|
| **Docker Compose** | Full stack locally or on a VPS | [`docs/install/install.md`](./docs/install/install.md) |
| **Railway** | API + Postgres + Redis + Celery | [`docs/install/railway.md`](./docs/install/railway.md) · [`railway.toml`](./railway.toml) |
| **Vercel** | Next.js portal | [`docs/install/vercel.md`](./docs/install/vercel.md) · [`frontend/vercel.json`](./frontend/vercel.json) |
| **Architecture & env** | Reference | [`docs/install/technical.md`](./docs/install/technical.md) |

**Suggested cloud split:** Railway for the Django/Celery stack, Vercel for the portal (`NEXT_PUBLIC_API_URL` → your Railway API).

---

## Repo layout

```
backend/          Django + DRF API, Celery, migrations
frontend/         Next.js portal (/ → login; /install for local setup)
DevWeb/           Developer showcase site (Astro; extractable to its own repo)
docs/install/     Install & deploy guides
docs/PHASE*.md    Product phase notes
railway.toml      Railway API template
railway.worker.toml
frontend/vercel.json
```
---

## Status

- **Phase 1** — Royalty pipeline end-to-end (catalog, statements, splits, payouts, export, audit)
- **Phase 2** — 2FA, S3/R2, contracts & publishing scaffolds, statement PDFs, in-app notifications
- **Phase 3** — A&R, analytics, sync, marketing campaigns (more ops modules in progress)

Deep context: [`CLAUDE.md`](./CLAUDE.md) · Research: [`docs/research/`](./docs/research/)

---

## Contributing

Issues and PRs welcome. Keep changes focused; match existing Django/Next patterns and RBAC rules (Gap 5: role-scoped data).

```bash
# Backend tests (example)
cd backend && python manage.py test

# Frontend
cd frontend && npm run build
```

---

## License

[MIT](./LICENSE) © 2026 Ted Rubin
