# Good Faith Record Management

The flat-fee, distributor-agnostic record label management platform for indie labels outgrowing spreadsheets.

No percentage-of-earnings pricing. No distribution lock-in. Full data portability, always.

## The problem

Indie record labels (5–50 signed artists) run their business on Google Sheets until multi-distributor royalty complexity breaks the spreadsheet. Every existing tool either forces a distributor switch, takes a cut of earnings, or is priced/scoped for either solo DIY artists or enterprise labels — nothing serves the mid-market well.

## What makes this different

1. **Distributor-agnostic royalty hub** — ingest and normalize statements from DistroKid, TuneCore, CD Baby, FUGA, Symphonic, ONErpm, RouteNote, TooLost, Vydia, and The Orchard into one royalty run, without switching distributors.
2. **Flat-fee, no lock-in pricing** — never a percentage of earnings; full CSV/JSON export at any time.
3. **The indie-to-pro continuum** — built for labels between DIY tools and inaccessible enterprise platforms.
4. **Publishing admin without the 15–30% tax** — PRO registration, CWR filing, mechanical licensing, at a flat fee.
5. **Role-based operations security** — separate Artist / Manager / Finance / A&R views from day one.
6. **Portability & longevity guarantees** — open standards (DDEX, CSV, JSON) and full data export, so a platform shutdown never strands your catalog.

See [`CLAUDE.md`](./CLAUDE.md) for the full strategic context, competitor analysis, ICP, pricing tiers, and module build order.

## Repo layout

- `CLAUDE.md` — project context, strategic gaps, ICP, pricing, module build order, technical architecture
- `docs/research/` — source research and feature/competitor analysis
  - `record_label_software_feature_spec.md` — 200+ feature catalog across 20 modules
  - `competitor_reddit_research.md` — competitor analysis + Reddit intelligence
  - `label_management_software_master_report.md` — master synthesis report
  - `label_management_software_report.pdf` — final PDF deliverable
- `backend/` — Django + Django REST Framework API (Python)
- `frontend/` — Next.js (TypeScript) app shell for the Artist/Manager/Finance/A&R portals
- `docker-compose.yml` — local dev stack: Postgres, Redis, Celery worker, backend, frontend

## Local development

Requires Docker.

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

This starts:

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3020 | Next.js dev server |
| Backend API | http://localhost:8020 | Django, migrations run automatically on start |
| Auth | http://localhost:8020/api/auth/login/ | Token auth for portal sign-in |
| Catalog API | http://localhost:8020/api/catalog/ | Releases, artists, tracks |
| Royalties API | http://localhost:8020/api/royalties/ | Statement upload and royalty runs |
| Health check | http://localhost:8020/api/health/ | Verifies DB + Celery/Redis connectivity |
| Postgres | localhost:5434 | credentials in `backend/.env.example` |
| Redis | localhost:6380 | Celery broker |

Host ports are non-standard (5434, 6380, 8020, 3020) to avoid clashing with other services on shared dev boxes; containers talk to each other over the compose network on the standard ports.

Django superuser (for `/admin/` and to try out the `accounts.User` roles):

```bash
docker compose exec backend python manage.py createsuperuser
```

## Status

Platform/Infrastructure scaffolding is in place: RBAC-ready custom user model (Artist/Manager/Finance/A&R/Admin roles), Django+DRF backend, Next.js frontend, and the full stack verified booting via `docker compose up`.

**Catalog module (Phase 1):** `Label`, `Artist`, `Release`, and `Track` models with ISRC/UPC identifiers, label-scoped tenancy via `LabelMembership`, DRF API at `/api/catalog/`, and role-based queryset filtering (artists see only their own releases). Portal UI at `/catalog`.

**Royalties module (Phase 1, in progress):** `RoyaltyStatement` and `RoyaltyRun` models, multi-distributor statement upload at `/api/royalties/statements/`, Finance/Manager-only RBAC. Portal UI at `/royalties`. Statement parsing/normalization pipeline is next.

See `CLAUDE.md` for the planned module build order (Platform/Infrastructure → Catalog → Royalty Accounting → Splits → Payments → Artist Portals → ...).
