# CLAUDE.md — Good Faith Record Management

> This file provides full context for any AI agent, developer, or collaborator picking up this project.
> Last updated: July 17, 2026.

---

## Project Overview

**Product name:** Good Faith Record Management

**Goal:** Design and build open-source, self-hosted Record Label Management Software — a single platform that covers all 20 functional modules of the music label business at professional depth, with no distribution lock-in, no cut of earnings, and full data portability.

**Research basis:** This project is grounded in deep industry intelligence conducted July 4, 2026:
- 200+ discrete features cataloged across 20 functional modules, sourced from first-party vendor pages
- 24+ competitor platforms analyzed (pricing, positioning, weaknesses, clients)
- 9 Reddit threads mined across 7 subreddits for real-world pain points and wish-list features
- 6 confirmed strategic whitespace gaps where no current platform is winning

**Core research files in this workspace:**
- `docs/research/record_label_software_feature_spec.md` — Full 200+ feature catalog, module by module, all cited
- `docs/research/competitor_reddit_research.md` — Competitor analysis + Reddit intelligence with verbatim quotes
- `docs/research/label_management_software_master_report.md` — Master synthesis report (Markdown source)
- `docs/research/label_management_software_report.pdf` — Final 31-page PDF deliverable

---

## The Problem We're Solving

Record labels — from 3-person indie operations to mid-sized independents with 10–100 artists — run their entire business on **Google Sheets**. The migration trigger is when multi-distributor royalty complexity breaks the spreadsheet.

**The #1 unmet need** (confirmed across Reddit in r/recordlabels, r/musicians, r/musicbusiness, r/House, r/WeAreTheMusicMakers):

> *"The bigger issue is we manage artists under different distributors and it becomes a problem when combining royalty statements from different distributors into one spreadsheet."*

No current platform solves this without forcing a distributor switch.

---

## The 6 Strategic Gaps (Our Competitive Moat)

These are the confirmed whitespace opportunities where every current competitor fails:

### Gap 1 — Distributor-Agnostic Royalty Hub ⭐ HIGHEST PRIORITY
Auto-ingest royalty statements from ALL major distributors simultaneously (DistroKid, TuneCore, CD Baby, FUGA, Symphonic, ONErpm, RouteNote, TooLost, Vydia, The Orchard) — normalize them — produce a single royalty run. **Without requiring the label to switch distributors.**

### Gap 2 — Flat-Fee, No Lock-In Pricing
The community viscerally hates % of earnings models and distrusts platforms with hard cancellation. Label Engine's $499/yr flat fee is praised; Infinite Catalog's scaling cost is resented. Full CSV/JSON export at any time. Explicit data portability guarantee in the product and marketing.

### Gap 3 — The Indie-to-Pro Continuum
DIY tools (DistroKid, TuneCore) are too simple. Enterprise tools (Synchtank, Labelcamp, FUGA) are inaccessible and not self-serve. The mid-market — an indie label with 10–100 artists, growing catalog complexity, and real royalty contracts — is underserved. This is our primary ICP.

### Gap 4 — Publishing Admin Without the 15–30% Tax
Songtrust has a damaged reputation (slow registration, duplicate registrations, hard cancellation). A platform that handles PRO registration (ASCAP/BMI/SESAC/SOCAN), CWR filing, mechanical licensing, and society collection at a **flat fee** directly addresses a stated frustration.

### Gap 5 — Role-Based Operations Security
No current affordable platform adequately separates:
- **Artist view:** their royalties, their releases only
- **Manager view:** all artists, budgets, release calendar
- **Finance view:** all financial data, statements, contracts
- **A&R view:** artist pipeline, signing status, no financial data

Shared Notion/Google Drive setups expose splits, payouts, and logins to people who shouldn't see them. This is a compliance and trust failure. **Two-factor authentication (2FA)** for all portal users is a Phase 2 requirement — especially Finance and Manager roles handling payouts.

### Gap 6 — Portability & Longevity Guarantees
The fear of platform closure is a major reason labels stay on spreadsheets.

> *"These websites with their own programs or interfaces are pretty — but if they ever close or do a major update of the program, it could really screw things up."*

Must address this proactively: full data export, open standards (DDEX, CSV, JSON), explicit succession/escrow commitment.

---

## The 20 Feature Modules (Full Scope)

All 20 modules are documented in detail in `docs/research/record_label_software_feature_spec.md` and the master report. Summary:

| # | Module | Priority | Phase |
|---|--------|----------|-------|
| 1 | Catalog & Asset Management | Critical | Phase 1 |
| 2 | Metadata Management | Critical | Phase 1 |
| 3 | Digital Asset Management (DAM) | High | Phase 1 |
| 4 | Royalty Accounting & Distribution | Critical | Phase 1 |
| 5 | Payments & Payouts | Critical | Phase 1 |
| 6 | Contract & Rights Management | High | Phase 2 (scaffold) |
| 7 | Splits Management | High | Phase 1 |
| 8 | Publishing Administration | High | Phase 2 (scaffold) |
| 9 | Distribution & Release Management | High | Phase 2 |
| 10 | Sync Licensing Management | Medium | Phase 3 |
| 11 | A&R Management | Medium | Phase 3 |
| 12 | Artist & Contributor Portals | High | Phase 1 (basic) / Phase 2 (depth) |
| 13 | Marketing & Promotion Tools | Medium | Phase 3 |
| 14 | Direct-to-Consumer / Commerce | Low | Phase 4 |
| 15 | Analytics & Reporting | High | Phase 2 |
| 16 | Workflow & Project Management | Medium | Phase 2 |
| 17 | Communication & Collaboration | Medium | Phase 3 |
| 18 | Financial Accounting & ERP | Medium | Phase 3 |
| 19 | Legal & Compliance | High | Phase 2 |
| 20 | Platform / Infrastructure | Critical | Phase 1 (core) / Phase 2 (2FA, S3) |

---

## Competitor Landscape Summary

### Who We're Competing Against (and Their Fatal Flaws)

| Competitor | Fatal Flaw | Our Counter |
|---|---|---|
| **DISCO** | Sync/catalog only; no royalty backend; no ISRC generation; expensive for small artists | Full-stack + sync at same price point |
| **Reprtoir** | Perceived as expensive; 0 Capterra reviews; thin market penetration | Flat fee + transparent pricing |
| **Synchtank / Labelcamp** | Enterprise-only; not self-serve; no public pricing | Self-serve onboarding for indie market |
| **Revelator** | Trustpilot 2.5/5 — worst rating in the category | Trust-first positioning; data portability guarantee |
| **DistroKid / TuneCore** | Active community distrust; distribution lock-in; music deleted if subscription lapses | Distribution-agnostic; no lock-in; flat fee |
| **Infinite Catalog** | Pricing scales with catalog size — resented | Flat fee regardless of catalog size |
| **Curve Royalty** | Royalty-only; no catalog, distribution, or contracts | All-in-one at comparable price |
| **Songtrust** | Damaged reputation; 15–30% cut; slow registration; hard cancellation | Flat-fee publishing admin; instant PRO registration |
| **Label Engine** | Closest flat-fee competitor (~$499/yr) | Beat on features: role-based access, multi-distributor consolidation, artist portals |

### Platforms to Watch (Emerging)
- **LabelTrackr** — cheap, small-label focus, royalty splits in development
- **eddy.app** — flat-fee royalty accounting, multi-source ingestion
- **managist.app** — beta-stage all-in-one
- **ReleaseLoop** — release management for indie labels

---

## Primary ICP (Ideal Customer Profile)

**Primary:** Indie record label, 5–50 signed artists, $10K–$500K annual royalty throughput, currently managing on Google Sheets + 2–3 separate tools. Uses 2+ distributors. Has real split sheets and contracts. Outgrowing the spreadsheet.

**Secondary:** Solo artist acting as their own label, 1–10 releases, wants professional tools without enterprise pricing.

**Tertiary:** Mid-sized independent label, 50–200 artists, currently using Revelator, Reprtoir, or Curve, frustrated by cost, limited features, or trust issues.

**Anti-ICP (don't optimize for yet):**
- Major labels (need enterprise-grade SLAs and custom implementations)
- Pure DIY artists with no signed artists (DistroKid is fine for them)
- Production music libraries (Synchtank owns this; specialized workflow)

---

## Technical Architecture

**Status:** Decided July 5, 2026. **Phase 1 implemented** — see [Implementation Status](#implementation-status-july-17-2026) below.

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python — Django + Django REST Framework** | Best-in-class data-wrangling ecosystem (pandas, openpyxl, lxml) for normalizing messy multi-format distributor statements — the core moat. Built-in admin, ORM, and permissions accelerate RBAC and internal ops tooling (A&R pipeline, contract review). DRF powers the Pro-tier API access. |
| Database | **PostgreSQL** | Transactional integrity for money movement (royalties, splits, payouts); native JSON columns for flexible per-distributor raw-statement storage alongside a normalized relational schema. |
| Async jobs | **Celery + Redis** | Statement parsing, PRO registration polling, and report generation run as background jobs rather than blocking requests. |
| Frontend (portal) | **React + Next.js 16 (TypeScript)** | Artist / Manager / Finance / A&R portals as a single codebase with role-based views (Gap 5). |
| Marketing site | **Astro (static)** | Pre-launch credibility page at usegoodfaith.com — separate from the authenticated portal. See `PRODUCT.md` for brand/design brief. |
| File / asset storage | **Local `MEDIA_ROOT` in dev; S3-compatible object storage in prod** (AWS S3 or Cloudflare R2) | Royalty statement uploads work locally today; production DAM and statement storage should move to signed-URL object storage. |
| Payments (artist royalties) | **Mark-paid + ACH CSV** | Manual mark-paid and ACH CSV batch export. **No SaaS subscription billing** (Stripe/PayPal plans out of scope). |
| Email | Optional self-hosted SMTP | No Listmonk waitlist / SaaS email capture. |

**Trade-off accepted:** a Node/TypeScript full-stack (Next.js + Prisma) would give one language end-to-end and faster portal iteration, but was passed over because the distributor-statement-normalization moat benefits more from Python's data ecosystem than the frontend benefits from stack unification.

**Deployment:** Docker Compose for local dev (`docker compose up`). Production stack via `docker-compose.prod.yml` (Gunicorn + Next.js prod). CI via GitHub Actions (`.github/workflows/ci.yml`). Marketing site deployed statically behind nginx + Let's Encrypt at usegoodfaith.com (`marketing/deploy/nginx/`).

---

## Implementation Status (July 17, 2026)

**Phase 1 is complete.** Phase 2 unblocked scope is complete (July 2026) — see [`docs/PHASE2.md`](docs/PHASE2.md). Phase 3 in progress: A&R, analytics, sync, marketing — see [`docs/PHASE3.md`](docs/PHASE3.md). Open source (MIT). No SaaS subscription billing. DDEX / CWR / Chartmetric remain deferred integrations.

See [`docs/PHASE1.md`](docs/PHASE1.md) for onboarding and walkthrough.

### Done (Phase 1)

| Area | What's shipped |
|---|---|
| **Platform / Infrastructure** | Django 6 + DRF, PostgreSQL, Redis, Celery worker, Docker Compose dev + prod stacks, health check at `/api/health/`, GitHub Actions CI (35 tests) |
| **Onboarding** | `python manage.py seed_label` — creates label + manager user without Django admin; `--demo` seeds sample catalog |
| **Auth** | Token auth + **2FA (TOTP + backup codes)** — `/api/auth/login/`, `/2fa/*`, `/logout/`, `/me/`. Required for Manager/Finance/Admin before financial APIs; portal at `/settings/security`. |
| **RBAC (Gap 5)** | `accounts.User` with `Role` enum (artist/manager/finance/ar/admin). Permission classes key off `user.role`, not `is_staff`. Enforced in API queryset filters and portal nav across catalog, royalties, splits, payments, audit, and export. |
| **Catalog (Module 1 — Phase 1)** | `Label`, `LabelMembership`, `Artist`, `Release`, `Track` models. ISRC + **ISWC** on tracks, UPC on releases. API at `/api/catalog/`. Portal CRUD at `/catalog`, `/catalog/artists`, release detail (tracks). Manager/Finance/A&R/Admin write; Artists read-own. |
| **Royalties (Module 4 — Phase 1)** | `RoyaltyStatement`, `RoyaltyLineItem`, `RoyaltyRun`, `RoyaltyRunPayout`. **10-distributor parser** (Gap 1): DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, Vydia, The Orchard. Run consolidation applies finalized split sheets. Portal: upload, statement detail, run create, payout breakdown, issue payouts. |
| **Splits (Module 7 — Phase 1)** | `SplitSheet` (one per track) + `SplitEntry`. API at `/api/splits/sheets/`. Finalized sheets must total 100%. Applied during royalty run consolidation. Portal at `/splits`. |
| **Payments (Module 5 — Phase 1)** | `PayoutBatch` + `Payout`. Issue batch from run, mark-paid, **ACH CSV export**, **PDF statements**. No SaaS billing. Portal at `/payments`. |
| **Data export (Gap 6 — Phase 1)** | `GET /api/export/?export_format=json|csv` — role-scoped export. Finance/Manager/Admin get full label data + audit log; Artist gets own data; A&R gets catalog only. Portal at `/export`. |
| **Audit trail** | `AuditEvent` in `apps/audit/` — immutable log of uploads, parses, consolidation, split finalization, payout issuance, mark-paid. Portal at `/activity`. |
| **Artist portal (Module 12 — Phase 1 basic)** | Role-aware dashboard (`ArtistDashboard`), scoped nav labels ("My releases", "My payouts"), simplified artist payments view. |
| **Portal UI** | Next.js 16 at `frontend/` — `/dashboard`, `/catalog`, `/pipeline`, `/sync`, `/marketing`, `/analytics`, `/splits`, `/royalties`, `/payments`, `/notifications`, `/activity`, `/export`. Brand OKLCH tokens aligned with marketing site. |
| **Marketing / project site** | Astro static site at `marketing/`. Optional; not a SaaS funnel. Portal `/` is the install homepage. |

### Phase 2 (complete — deferred items remain)

| Shipped | Deferred (Phase 2+/3) |
|---|---|
| **2FA** (TOTP + backup codes, mandatory for Manager/Finance/Admin) | — |
| **ISWC** on tracks | DDEX ingestion |
| **S3/R2** object storage (optional env config) | Publishing admin depth (CWR, society APIs) |
| **Contracts** scaffold (`/api/contracts/`, `/contracts`) | Obligation/AI extraction, e-sign vendors |
| **Publishing** scaffold (`/api/publishing/works/`, `/publishing`) | CWR filing, society APIs |
| **Artist earnings** (`/earnings`) + **portal invites** | Email notifications (optional SMTP) |
| Password change in Security settings | |
| **Statement PDFs** (run + batch + payout) | |
| **In-app notifications** (`/notifications`) | |

### Phase 3 (in progress)

| Shipped | Next / deferred |
|---|---|
| **A&R pipeline** (`/api/ar/prospects/`, `/pipeline`) — stages, priority, discovery links, signed-artist link | ERP |
| **Analytics basics** (`/api/analytics/summary/`, `/analytics`) — role-scoped internal dashboards from royalty/catalog/pipeline data | Chartmetric / Soundcharts integrations |
| **Sync licensing** (`/api/sync/opportunities/`, `/sync`) — pitch-to-license tracker with fee/territory/catalog links | Supervisor marketplace, cue sheets, DISCO |
| **Marketing campaigns** (`/api/marketing/campaigns/`, `/marketing`) — release/playlist/press promo tracker with smart-link URLs | Built-in smart links, ad automation |
| | DDEX / CWR / Chartmetric |

### Phase 1 end-to-end flow

```
seed_label → catalog (artists/releases/tracks) → splits (finalize)
  → upload statements → create royalty run → issue payouts → ACH CSV / mark paid
  → activity log + full data export
```

### Module build progress

```
✅ Phase 1 — Platform, catalog, royalties (10 distributors), splits, payments, export, audit, artist portal
✅ Phase 2 — 2FA, ISWC, S3, contracts, publishing scaffold, artist earnings/invites, statement PDFs, in-app notifications
🟡 Phase 3 — A&R + analytics + sync + marketing shipped; ERP / external analytics next
⬜ Deferred integrations — DDEX, CWR/society APIs, Chartmetric/Soundcharts
```

### Repo layout (code)

| Path | Purpose |
|---|---|
| `backend/apps/accounts/` | Custom `User` model, token auth, `seed_label` management command |
| `backend/apps/core/` | Health check, data export (`/api/export/`), shared models |
| `backend/apps/catalog/` | Label tenancy, artists, releases, tracks |
| `backend/apps/royalties/` | Statement upload, parser (`parsers/`), Celery task, runs, consolidation |
| `backend/apps/splits/` | Track-level split sheets and entries |
| `backend/apps/payments/` | Payout batches, mark-paid, ACH CSV export |
| `backend/apps/publishing/` | Musical works, writer shares, PRO registration status |
| `backend/apps/notifications/` | In-app notifications (statement + payout events) |
| `backend/apps/ar/` | A&R talent pipeline (prospects, stages) |
| `backend/apps/analytics/` | Role-scoped analytics summary (royalty/catalog/pipeline aggregates) |
| `backend/apps/sync/` | Sync licensing opportunities (pitch → license) |
| `backend/apps/marketing/` | Marketing campaigns (release/playlist/press promo) |
| `frontend/` | Next.js portal (port 3020 in dev) |
| `marketing/` | Astro marketing site; build output in `marketing/dist/` |
| `PRODUCT.md` | Marketing-site brand brief |
| `docker-compose.yml` | Local dev: Postgres :5434, Redis :6380, backend :8020, frontend :3020 |
| `docker-compose.prod.yml` | Production: Gunicorn, Next.js prod, persistent media volume |
| `docs/PHASE1.md` | Phase 1 onboarding, walkthrough, production deploy |
| `.github/workflows/ci.yml` | CI: backend tests + frontend build on push to main |

### Key API endpoints

| Endpoint | Access |
|---|---|
| `POST /api/auth/login/` | Public |
| `GET /api/auth/me/` | Authenticated |
| `/api/catalog/labels\|artists\|releases\|tracks/` | Label members; artists read-own for releases |
| `/api/royalties/statements/` | Finance, Manager, Admin only |
| `/api/royalties/statements/{id}/line_items/` | Finance, Manager, Admin only — parsed rows for a statement |
| `/api/royalties/statements/{id}/reprocess/` | Finance, Manager, Admin only — re-run the parser |
| `/api/royalties/runs/` | Finance, Manager, Admin only — create consolidates statements |
| `/api/royalties/runs/{id}/payouts/` | Per-participant payout breakdown for a run |
| `/api/royalties/runs/{id}/consolidate/` | Re-run consolidation after statement/split changes |
| `/api/splits/sheets/` | Label members; Artist read-own; A&R blocked; Manager/Finance/Admin write |
| `/api/payments/batches/` | Finance, Manager, Admin write; Artist read-own batches containing their payouts |
| `POST /api/payments/batches/from_run/` | Issue payout batch from a ready royalty run |
| `/api/payments/payouts/` | List payouts; Artist read-own |
| `POST /api/payments/payouts/{id}/mark_paid/` | Finance, Manager, Admin — record payment |
| `GET /api/payments/batches/{id}/ach_export/` | Finance, Manager, Admin — ACH CSV for pending payouts |
| `GET /api/royalties/runs/{id}/pdf/` | Finance, Manager, Admin — royalty run PDF statement |
| `GET /api/payments/batches/{id}/pdf/` | Finance/Manager/Admin full; Artist own lines — payout PDF |
| `GET /api/payments/payouts/{id}/pdf/` | Same as payout access — single-participant PDF |
| `GET /api/notifications/` | Authenticated — own notifications |
| `GET /api/notifications/unread_count/` | Authenticated — unread badge count |
| `/api/ar/prospects/` | Manager, A&R, Admin — talent pipeline CRUD |
| `GET /api/analytics/summary/` | Role-scoped analytics — Finance/Manager/Admin label financials (+2FA); Artist own earnings; A&R catalog/pipeline counts only |
| `/api/sync/opportunities/` | Manager/A&R/Admin write; Finance read; Artist read-own — sync pitch tracker |
| `/api/marketing/campaigns/` | Manager/A&R/Admin write; Finance read; Artist read-own — promo campaigns |
| `GET /api/export/?export_format=json\|csv` | Label members — role-scoped data export |
| `/api/audit/events/` | Finance, Manager, Admin — immutable activity log |

### Local dev quick start

```bash
cp backend/.env.example backend/.env
docker compose up --build

# Bootstrap first label (no admin required):
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" --manager-username manager \
  --manager-password 'changeme' --demo

# Portal: http://localhost:3020/login
```

Upload dev files land in `backend/media/` (gitignored).

### Production deploy

```bash
cp backend/.env.production.example backend/.env
# Edit DJANGO_SECRET_KEY, POSTGRES_PASSWORD, ALLOWED_HOSTS, CORS, PORTAL_API_URL
docker compose -f docker-compose.prod.yml up --build -d
```

Place nginx/Caddy in front with TLS; set `X-Forwarded-Proto: https` and enable `DJANGO_SECURE_SSL_REDIRECT=true` in production.

---

## Key Technical Decisions & Architecture Notes

### Must-Have at Launch
- **Multi-distributor statement parser** — the core moat. Must handle CSV/TSV/XLSX formats from DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, The Orchard. Auto-detect format. Normalize to internal schema. *(Shipped for all ten listed distributors via `apps/royalties/parsers/` — alias-based column mapping per distributor, pandas-backed CSV/TSV/XLSX loading, Celery task triggered on upload. Header aliases for TooLost/FUGA/Vydia/The Orchard are best-effort and should be validated against real vendor exports.)*
- **DDEX ingestion** — industry standard for DSP/distributor data exchange
- **ISRC / UPC / ISWC storage and management** — core identifiers *(ISRC + UPC + ISWC on tracks today)*
- **Role-based access control (RBAC)** — Artist / Manager / Finance / A&R / Admin roles from day one *(implemented on catalog + royalties APIs and portal nav)*
- **Full data export (CSV + JSON)** — must be a first-class feature, not an afterthought *(shipped — role-scoped JSON/CSV export)*
- **Audit trail** — immutable log of all financial changes *(shipped — `AuditEvent` + `/activity` portal)*
- **Two-factor authentication (2FA)** — TOTP/WebAuthn for portal login; required for roles with payout access *(shipped — TOTP + backup codes)*

### Data Standards to Support
- **DDEX** — distribution and royalty data exchange
- **CWR** — common works registration (publishing)
- **ISRC** — International Standard Recording Code
- **ISWC** — International Standard Musical Work Code
- **UPC/EAN** — release barcodes
- **CAE/IPI** — composer/publisher identifiers

### Integration Targets (by priority)
**Phase 1 (statement parsers):** DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, Vydia, The Orchard
**Phase 2 (platform security):** Two-factor authentication (TOTP, backup codes, optional WebAuthn)
**Phase 2 (API integrations):** FUGA, The Orchard, Merlin
**Phase 2 (ACH):** Artist bank details on file; optional future automation *(Phase 1 ships manual ACH CSV export)*
**Phase 3 (PRO registration):** ASCAP, BMI, SESAC, SOCAN, SoundExchange
**Phase 3 (analytics):** Chartmetric API, Soundcharts API
**Phase 4 (sync):** DISCO integration or direct supervisor network

---

## Licensing & commercial model

**License:** MIT — see [`LICENSE`](LICENSE).

**Core principle:** Never a percentage of earnings. Self-host for free; no SaaS subscription billing in-product (no Stripe/PayPal plans for access).

Artist royalty **payouts** use mark-paid + ACH CSV export (ops tooling), not platform subscription fees.

Optional future: paid support / hosted offerings outside this repo — not required to run the software.

---

## Community Intelligence — Key Verbatim Quotes

Use these in marketing, onboarding copy, and investor decks:

> *"I didn't find many options."* — r/recordlabels (the market gap in one sentence)

> *"I want all the services of something like DistroKid, without the distribution."* — r/musicians

> *"All the good options either scale up with your earnings or have a high monthly cost."* — r/recordlabels

> *"Distrokid is not what I want. I don't trust them at all."* — r/musicians

> *"It seems like there should be something for a label without needing to involve distribution."* — r/musicians

> *"No one can recall which version of the master was approved."* — r/musicindustry

> *"An all-in-one Notion setup can quickly turn into a cluttered mess."* — r/musicindustry

> *"Many labels rely on Google Sheets... This results in significant manual effort."* — r/musicindustry

> *"These websites with their own programs — if they ever close, it could really screw things up."* — r/WeAreTheMusicMakers

---

## Research Sources

All findings are grounded in fetched, first-party pages. Key sources:

| Source | What It Provided |
|---|---|
| [Curve Royalty Systems](https://www.curveroyaltysystems.com) | Deepest royalty feature set; pricing (Lite £20/mo, Pro £250/mo) |
| [Labelcamp](https://www.labelcamp.io) | Distribution + catalog management feature list |
| [Synchtank](https://synchtank.com) | Enterprise catalog + sync platform features |
| [DISCO](https://disco.ac) | Sync/catalog file management; pricing tiers |
| [Reprtoir](https://reprtoir.com) | All-in-one workspace feature set |
| [Jammber](http://www.jammber.com) | Splits, payments, PRO registration features |
| [Music Reports](https://www.musicreports.com) | Publishing admin, licensing, Songdex registry |
| [Backbeat Solutions](https://backbeatsolutions.co.uk) | Publishing admin depth; CWR/ACK; income consolidation |
| [ALV Software](https://www.alv-software.com/label/) | Label ERP features; inventory, recoupment, return reserves |
| [Contracko](https://contracko.com/blog/record-label-management-software) | Contract management stack analysis |
| [Chartmetric](https://chartmetric.com) | Analytics; G2 4.7/5 (best-reviewed in category) |
| [Revelator](https://revelator.com) | Trustpilot 2.5/5 (worst-rated); competitive intelligence |
| [Stem](https://stem.is) | Advances, money management, per-shareholder dashboards |
| [FUGA](https://fuga.com) | B2B distribution + white-label; acquired Songspace |
| [Music Glue](https://www.musicglue.com) | D2C commerce; fan data ownership |
| Reddit: [r/recordlabels](https://www.reddit.com/r/recordlabels/) | Primary community pain points |
| Reddit: [r/musicians](https://www.reddit.com/r/musicians/) | Distribution lock-in frustration |
| Reddit: [r/musicbusiness](https://www.reddit.com/r/musicbusiness/) | Publishing admin frustration; Songtrust distrust |
| Reddit: [r/WeAreTheMusicMakers](https://www.reddit.com/r/WeAreTheMusicMakers/) | Spreadsheet loyalty; platform closure fear |
| Reddit: [r/musicindustry](https://www.reddit.com/r/musicindustry/) | Operations security; version control pain |
| Reddit: [r/House](https://www.reddit.com/r/House/) | Dance label mgmt; Label Engine recommendation |
| Reddit: [r/musicmarketing](https://www.reddit.com/r/musicmarketing/) | DISCO FAQ thread |
| Reddit: [r/edmproduction](https://www.reddit.com/r/edmproduction/) | Producer/label operations at scale |

---

## Working Files

| File | Description |
|---|---|
| `docs/research/record_label_software_feature_spec.md` | 200+ features, 20 modules, all cited from first-party sources |
| `docs/research/competitor_reddit_research.md` | 24 competitor profiles + 9 Reddit threads + cross-cutting themes |
| `docs/research/label_management_software_master_report.md` | Full master synthesis (Markdown) |
| `docs/research/label_management_software_report.pdf` | 31-page professional PDF deliverable |
| `PRODUCT.md` | Marketing-site brand brief — audience, trust tone, design principles, anti-references |
| `docs/PHASE1.md` | Phase 1 complete — onboarding, walkthrough, production deploy |
| `docs/PHASE2.md` | Phase 2 complete — 2FA, scaffolds, PDFs, notifications |
| `docs/PHASE3.md` | Phase 3 — A&R pipeline + analytics basics |
| `README.md` | Repo quick start, Phase 1 module status, CI |
| `marketing/` | Astro static site for usegoodfaith.com |
| `CLAUDE.md` | This file — project context for AI agents and collaborators |

---

## Instructions for AI Agents Working on This Project

1. **Always read this file first** before starting any task related to this project.
2. **The master report** (`docs/research/label_management_software_master_report.md`) is the source of truth for features and competitor intelligence.
3. **The 6 strategic gaps** are the north star — every product decision should address at least one of them.
4. **The primary ICP** is an indie label with 5–50 signed artists, multiple distributors, outgrowing spreadsheets. Design for them first.
5. **Licensing:** MIT. Never propose a percentage-of-earnings model. No SaaS subscription billing in-product.
6. **Trust is the #1 brand value.** Data portability, role-based access, and self-host control are non-negotiable.
7. When writing product copy, pull from the verbatim Reddit quotes in the Community Intelligence section — they are the exact language the market uses.
8. **Module build order:** Phase 1 and unblocked Phase 2 complete. Phase 3 in progress. Deferred integrations: DDEX, CWR, Chartmetric/Soundcharts. See `docs/PHASE2.md`, `docs/PHASE3.md`, and `docs/install/`.
9. **Portal vs project site:** `frontend/` `/` is the install homepage. `marketing/` is optional. Deploy templates: `frontend/vercel.json`, `railway.toml`.
10. **Financial data access:** A&R must never see royalty statements, runs, splits, or payout data. Artists see **only their own** splits and payouts — never label-wide financial data. Enforce in API queryset filters and portal nav, not just UI hiding.
