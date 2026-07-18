# Phase 3 — Mid-market ops modules

Phase 3 opens the mid-market ops modules after Phase 1 royalties and Phase 2 security/scaffolds. Shipped so far: **A&R pipeline** (Module 11), **Analytics & Reporting basics** (Module 15 — internal dashboards), and **Sync Licensing** (Module 10).

## Why A&R first

- Labels already have an `ar` role that could manage catalog/contracts but had no talent pipeline.
- Gap 5 requires A&R to see signing status **without** royalty/payout data — a dedicated pipeline module enforces that boundary.
- Spec features (pipeline stages, talent tracking links, A&R permissions) map cleanly onto existing Django+DRF / Next.js patterns.

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

### Not in the A&R starter

- Streaming/social analytics auto-ingest (Chartmetric, etc.)
- Mentoring / community leaderboard funnels
- Automatic roster creation on “signed”
- Prospect activity timeline / notes thread (single `notes` field only)

---

## Shipped — Analytics & Reporting basics (July 2026)

Internal dashboards aggregated from existing royalty runs, statements, payouts, catalog, and pipeline data. **No Chartmetric / Soundcharts integrations** yet (deferred).

### API

| Endpoint | Notes |
|---|---|
| `GET /api/analytics/summary/` | Role-scoped summary |
| Query `?period_start=&period_end=` | Optional ISO date filters (label financial scope) |

### RBAC (Gap 5)

| Role | Response `scope` | Contents |
|---|---|---|
| Finance / Manager / Admin | `label` | Statement gross, run allocations, payout pending/paid; breakdowns by distributor, period, artist, track; catalog counts. Manager/Admin also get pipeline stage counts. **Mandatory 2FA.** |
| Artist | `artist` | Own earnings, payout pending/paid; by period, track, and royalty run. Never label-wide financials. |
| A&R | `ops` | Catalog counts + pipeline stage counts only — **no royalty/payout figures**. |

### Portal

`/analytics` — simple totals + CSS bar lists / tables. Nav for all label roles (artist label: **My analytics**).

### Aggregation sources

- Distributor / period totals → processed `RoyaltyStatement` + `RoyaltyLineItem`
- Artist / track allocations → `RoyaltyRunPayout` (post-split)
- Payout pending/paid → `Payout`
- Ops → `Artist` / `Release` / `Track` counts + `Prospect` by stage

### Not in this starter

- Chartmetric / Soundcharts / playlist / fan analytics
- Custom report builder / scheduled email reports
- Territory / DSP store drill-downs beyond line-item period rollups
- CSV export of analytics slices (use `/api/export/` for raw data)

---

## Shipped — Sync Licensing (July 2026)

Pitch-to-license opportunity tracker (Module 10) without DISCO/Synchtank lock-in. Links catalog tracks/releases/artists and optional sync contracts; records fee, territory, exclusivity, and supervisor contacts.

### Data model

`SyncOpportunity` on a label with:

| Field | Purpose |
|---|---|
| `status` | inquiry → pitched → shortlisted → cleared → licensed / passed / on_hold |
| `media_type` | film / tv / ad / trailer / game / social / other |
| Client + supervisor | studio/brand, supervisor name/email |
| Deal terms | fee, currency, territory, exclusivity, term notes |
| Catalog links | optional `track`, `release`, `artist` |
| `contract` | optional link to a sync-type `Contract` when the deal closes |
| `pitched_at` / `licensed_at` | milestone dates |

### RBAC (Gap 5)

| Role | Access |
|---|---|
| Manager / A&R / Admin | Full CRUD |
| Finance | Read-only (fees for accounting) |
| Artist | Own opportunities only (linked artist or release primary artist) |

### API

| Endpoint | Notes |
|---|---|
| `GET/POST /api/sync/opportunities/` | List / create |
| `GET/PATCH/DELETE /api/sync/opportunities/{id}/` | Detail |
| Query `?status=` / `?media_type=` | Optional filters |

### Portal

`/sync` — status filter chips, opportunity table, create/edit form. Nav **Sync** / **My sync** for all label roles with access.

### Not in this starter

- Supervisor marketplace / MultiDISCO-style discovery
- Pitch playlist sharing + engagement analytics
- Cue sheet automation
- DISCO / Synchtank integrations

---

## Remaining Phase 3+

| Module | Status |
|---|---|
| Analytics & Reporting (external integrations) | Deferred — Chartmetric / Soundcharts |
| Marketing & Promotion | Deferred |
| Communication & Collaboration | Deferred (in-app notifications already in Phase 2) |
| Financial Accounting & ERP | Deferred |
| Stripe Connect / DDEX / CWR / Listmonk | Still deferred from Phase 2+ |

See `CLAUDE.md` for the full roadmap.
