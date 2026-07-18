# Good Faith Record Management

The flat-fee, distributor-agnostic record label management platform for indie labels outgrowing spreadsheets.

No percentage-of-earnings pricing. No distribution lock-in. Full data portability, always.

**Phase 1 is complete.** See [`docs/PHASE1.md`](./docs/PHASE1.md) for onboarding, the end-to-end royalty walkthrough, and production deploy.

## The problem

Indie record labels (5–50 signed artists) run their business on Google Sheets until multi-distributor royalty complexity breaks the spreadsheet. Every existing tool either forces a distributor switch, takes a cut of earnings, or is priced/scoped for either solo DIY artists or enterprise labels — nothing serves the mid-market well.

## What makes this different

1. **Distributor-agnostic royalty hub** — ingest and normalize statements from 10 major distributors into one royalty run, without switching distributors.
2. **Flat-fee, no lock-in pricing** — never a percentage of earnings; full CSV/JSON export at any time.
3. **The indie-to-pro continuum** — built for labels between DIY tools and inaccessible enterprise platforms.
4. **Role-based operations security** — separate Artist / Manager / Finance / A&R views from day one.
5. **Portability & longevity guarantees** — open standards and full data export, so a platform shutdown never strands your catalog.
6. **Immutable audit trail** — every financial action logged for finance and compliance.

See [`CLAUDE.md`](./CLAUDE.md) for the full strategic context, competitor analysis, ICP, pricing tiers, and Phase 2 roadmap.

## Repo layout

| Path | Purpose |
|---|---|
| `backend/` | Django + DRF API |
| `frontend/` | Next.js portal (Artist / Manager / Finance / A&R) |
| `marketing/` | Astro site for usegoodfaith.com |
| `docker-compose.yml` | Local dev stack |
| `docker-compose.prod.yml` | Production stack (Gunicorn + Next.js prod) |
| `docs/PHASE1.md` | Phase 1 onboarding and walkthrough |

## Local development

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

| Service | URL |
|---|---|
| Portal | http://localhost:3020 |
| API | http://localhost:8020 |
| Health | http://localhost:8020/api/health/ |

### Bootstrap a label (no admin UI required)

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'changeme' \
  --demo
```

Then sign in at http://localhost:3020/login.

## Phase 1 modules

| Module | Status |
|---|---|
| Platform + RBAC | ✅ |
| Catalog (API + portal CRUD) | ✅ |
| Royalties (10-distributor parser, runs, consolidation) | ✅ |
| Splits | ✅ |
| Payments (batch issue, mark paid, ACH CSV export) | ✅ |
| Data export (JSON + CSV ZIP) | ✅ |
| Audit trail | ✅ |
| Artist portal | ✅ |

**Phase 2:** Unblocked scope complete (2FA, ISWC, S3/R2, contracts + publishing scaffolds, artist earnings/invites, statement PDFs, in-app notifications). Stripe Connect / DDEX / Listmonk / CWR remain deferred — see `docs/PHASE2.md`.

**Phase 3:** A&R talent pipeline shipped (`/pipeline`, `/api/ar/prospects/`) — see `docs/PHASE3.md`.

## Production

```bash
cp backend/.env.production.example backend/.env
# Edit secrets and domains
docker compose -f docker-compose.prod.yml up --build -d
```

## CI

GitHub Actions runs backend tests and frontend build on every push to `main` (`.github/workflows/ci.yml`).
