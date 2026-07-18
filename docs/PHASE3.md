# Phase 3 — A&R Management (starter)

Phase 3 opens the mid-market ops modules after Phase 1 royalties and Phase 2 security/scaffolds. The first ship is **A&R pipeline** (Module 11) — the clearest ICP fit for indie labels with an existing A&R role and Gap 5 RBAC.

## Why A&R first

- Labels already have an `ar` role that could manage catalog/contracts but had no talent pipeline.
- Gap 5 requires A&R to see signing status **without** royalty/payout data — a dedicated pipeline module enforces that boundary.
- Spec features (pipeline stages, talent tracking links, A&R permissions) map cleanly onto existing Django+DRF / Next.js patterns.
- Analytics (Module 15) needs more product design (Chartmetric vs internal reporting) and is deferred.

## Shipped — A&R Pipeline (July 2026)

### Data model

`Prospect` on a label with:

| Field | Purpose |
|---|---|
| `stage` | lead → researching → contacting → meeting → negotiating → signed / passed / on_hold |
| `priority` | low / medium / high / hot |
| Contact + discovery | email, phone, Spotify/Instagram URLs, other links, source |
| `signed_artist` | optional link to roster `Artist` when the deal closes |
| `assigned_to` / `created_by` | label-member ownership |

### RBAC (Gap 5)

| Role | Access |
|---|---|
| Manager / A&R / Admin | Full CRUD |
| Finance | **Denied** (financial modules only) |
| Artist | **Denied** (never see unsigned prospects) |

### API

| Endpoint | Notes |
|---|---|
| `GET/POST /api/ar/prospects/` | List / create |
| `GET/PATCH/DELETE /api/ar/prospects/{id}/` | Detail |
| Query `?stage=` / `?priority=` | Optional filters |

### Portal

`/pipeline` — stage filter chips, prospect table, create/edit form. Nav item **A&R Pipeline** for Manager / A&R / Admin only.

## Not in this starter

- Streaming/social analytics auto-ingest (Chartmetric, etc.)
- Mentoring / community leaderboard funnels
- Automatic roster creation on “signed”
- Prospect activity timeline / notes thread (single `notes` field only)

## Remaining Phase 3+

| Module | Status |
|---|---|
| Analytics & Reporting (internal dashboards) | Next candidate |
| Sync Licensing Management | Deferred |
| Marketing & Promotion | Deferred |
| Communication & Collaboration | Deferred (in-app notifications already in Phase 2) |
| Financial Accounting & ERP | Deferred |
| Stripe Connect / DDEX / CWR / Listmonk | Still deferred from Phase 2+ |

See `CLAUDE.md` for the full roadmap.
