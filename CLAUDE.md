# CLAUDE.md — Good Faith Record Management

> This file provides full context for any AI agent, developer, or collaborator picking up this project.
> Last updated: July 17, 2026.

---

## Project Overview

**Product name:** Good Faith Record Management

**Goal:** Design and build the definitive, "unicorn" Record Label Management Software — a single platform that covers all 20 functional modules of the music label business at professional depth, with transparent flat-fee pricing, no distribution lock-in, and full data portability.

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

Shared Notion/Google Drive setups expose splits, payouts, and logins to people who shouldn't see them. This is a compliance and trust failure.

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
| 6 | Contract & Rights Management | High | Phase 2 |
| 7 | Splits Management | High | Phase 1 |
| 8 | Publishing Administration | High | Phase 2 |
| 9 | Distribution & Release Management | High | Phase 2 |
| 10 | Sync Licensing Management | Medium | Phase 3 |
| 11 | A&R Management | Medium | Phase 3 |
| 12 | Artist & Contributor Portals | High | Phase 2 |
| 13 | Marketing & Promotion Tools | Medium | Phase 3 |
| 14 | Direct-to-Consumer / Commerce | Low | Phase 4 |
| 15 | Analytics & Reporting | High | Phase 2 |
| 16 | Workflow & Project Management | Medium | Phase 2 |
| 17 | Communication & Collaboration | Medium | Phase 3 |
| 18 | Financial Accounting & ERP | Medium | Phase 3 |
| 19 | Legal & Compliance | High | Phase 2 |
| 20 | Platform / Infrastructure | Critical | Phase 1 |

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

**Status:** Decided July 5, 2026. **Scaffolded and partially implemented** — see [Implementation Status](#implementation-status-july-10-2026) below.

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python — Django + Django REST Framework** | Best-in-class data-wrangling ecosystem (pandas, openpyxl, lxml) for normalizing messy multi-format distributor statements — the core moat. Built-in admin, ORM, and permissions accelerate RBAC and internal ops tooling (A&R pipeline, contract review). DRF powers the Pro-tier API access. |
| Database | **PostgreSQL** | Transactional integrity for money movement (royalties, splits, payouts); native JSON columns for flexible per-distributor raw-statement storage alongside a normalized relational schema. |
| Async jobs | **Celery + Redis** | Statement parsing, PRO registration polling, and report generation run as background jobs rather than blocking requests. |
| Frontend (portal) | **React + Next.js 16 (TypeScript)** | Artist / Manager / Finance / A&R portals as a single codebase with role-based views (Gap 5). |
| Marketing site | **Astro (static)** | Pre-launch credibility page at usegoodfaith.com — separate from the authenticated portal. See `PRODUCT.md` for brand/design brief. |
| File / asset storage | **Local `MEDIA_ROOT` in dev; S3-compatible object storage in prod** (AWS S3 or Cloudflare R2) | Royalty statement uploads work locally today; production DAM and statement storage should move to signed-URL object storage. |
| Payments | **Stripe** (cards/subscriptions) + **ACH/wire** rails | Flat-fee subscription billing plus artist royalty payouts. Manual mark-paid live; Stripe/ACH disbursement not yet integrated. |
| Email / waitlist | **Listmonk** (planned) | Waitlist email capture deferred until pricing and Listmonk infra are finalized. Marketing CTAs currently point to pricing and `hello@usegoodfaith.com`. |

**Trade-off accepted:** a Node/TypeScript full-stack (Next.js + Prisma) would give one language end-to-end and faster portal iteration, but was passed over because the distributor-statement-normalization moat benefits more from Python's data ecosystem than the frontend benefits from stack unification.

**Deployment:** Docker Compose for local dev (`docker compose up`). Marketing site deployed statically behind nginx + Let's Encrypt at usegoodfaith.com (`marketing/deploy/nginx/`). Production hosting/CI for the portal stack not yet decided.

---

## Implementation Status (July 17, 2026)

**Phase 1 is complete.** The portal supports the full royalty-to-payout loop without Django admin for day-one onboarding (`seed_label` management command). Production deploy via `docker-compose.prod.yml`. CI via GitHub Actions.

See [`docs/PHASE1.md`](docs/PHASE1.md) for onboarding and walkthrough.

### Done (Phase 1)

| Area | What's shipped |
|---|---|
| **Platform / Infrastructure** | Django 6 + DRF, PostgreSQL, Redis, Celery worker, Docker Compose stack, health check at `/api/health/` |
| **Auth** | Token auth via `rest_framework.authtoken` — `/api/auth/login/`, `/logout/`, `/me/` |
| **RBAC (Gap 5)** | `accounts.User` with `Role` enum (artist/manager/finance/ar/admin). Permission classes key off `user.role`, not `is_staff`. Catalog and royalties enforce role boundaries in queryset filters and write permissions. |
| **Catalog (Module 1 — partial)** | `Label`, `LabelMembership`, `Artist`, `Release`, `Track` models. ISRC on tracks, UPC on releases. API at `/api/catalog/`. Portal CRUD at `/catalog`, `/catalog/artists`, and release detail (tracks). Manager/Finance/A&R/Admin write; Artists read-own. |
| **Royalties (Module 4 — partial)** | `RoyaltyStatement`, `RoyaltyLineItem`, `RoyaltyRun`, `RoyaltyRunPayout`. Statement parser live (Gap 1). **Run consolidation live**: combines processed statements, applies finalized split sheets per track, exposes per-participant payouts at `/api/royalties/runs/{id}/payouts/`. Portal: statement detail, run create, run payout breakdown, issue payouts. |
| **Splits (Module 7 — partial)** | `SplitSheet` (one per track) + `SplitEntry` (participant, role, percentage). API at `/api/splits/sheets/`. Finalized sheets must total 100%. Manager/Finance/Admin write; Artist read-own; A&R blocked. Portal UI at `/splits` with create + expandable entry view. Applied during royalty run consolidation. |
| **Payments (Module 5 — Phase 1)** | Payout batches from runs, mark-paid, **ACH CSV export** for bank upload. Stripe Connect deferred to Phase 2. |
| **Data export (Gap 6 — partial)** | `GET /api/export/?export_format=json|csv&label={id}` — role-scoped full label export. Finance/Manager/Admin get catalog + splits + royalties + payments + audit log; Artist gets own catalog/splits/payouts; A&R gets catalog only. CSV returns a ZIP of per-table CSVs plus manifest JSON. Portal at `/export`. |
| **Audit trail** | `AuditEvent` model — immutable log of statement uploads/parses, run consolidation, split finalization, payout issuance, and mark-paid. API at `/api/audit/events/` (Finance/Manager/Admin). Portal at `/activity`. Included in full data export. |
| **Portal UI** | Next.js app at `frontend/` — login, dashboard (role-aware), `/catalog`, `/splits`, `/royalties`, `/payments`, `/activity`, `/export`. Artist role gets dedicated home, simplified payouts view, and scoped nav labels. |
| **Marketing site** | Astro static site at `marketing/` — hero, problem, 6 differentiators, pricing, social proof. Live at **usegoodfaith.com**. Waitlist form **removed** (Listmonk deferred); CTAs → pricing section and `hello@usegoodfaith.com`. |

### Phase 2 (next)

- Stripe Connect automated disbursement + subscription billing
- S3/R2 object storage (statements, DAM)
- DDEX ingestion, ISWC, metadata depth
- Contracts, publishing admin, artist bank details for ACH
- Listmonk waitlist on marketing site

### Module build progress

```
✅ Phase 1 complete — catalog → royalties → splits → payouts → export + audit
⬜ Phase 2 — Stripe, object storage, DDEX, contracts, publishing
```

### Repo layout (code)

| Path | Purpose |
|---|---|
| `backend/apps/accounts/` | Custom `User` model, token auth endpoints |
| `backend/apps/core/` | Health check, shared `TimeStampedModel`, `HasRole` permission factory |
| `backend/apps/catalog/` | Label tenancy, artists, releases, tracks |
| `backend/apps/royalties/` | Statement upload, statement parser (`parsers/`), Celery task, royalty runs |
| `backend/apps/splits/` | Track-level split sheets and entries |
| `backend/apps/audit/` | Immutable audit log for financial changes |
| `frontend/` | Next.js portal (port 3020 in dev) |
| `marketing/` | Astro marketing site; build output in `marketing/dist/` |
| `PRODUCT.md` | Marketing-site brand brief (trust tone, anti-references, design principles) |
| `docker-compose.yml` | Postgres :5434, Redis :6380, backend :8020, frontend :3020 |
| `docker-compose.prod.yml` | Production stack (Gunicorn, Next.js prod, persistent media volume) |
| `docs/PHASE1.md` | Phase 1 onboarding, walkthrough, production deploy |

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

---

## Key Technical Decisions & Architecture Notes

### Must-Have at Launch
- **Multi-distributor statement parser** — the core moat. Must handle CSV/TSV/XLSX formats from DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, The Orchard. Auto-detect format. Normalize to internal schema. *(Shipped for all ten listed distributors via `apps/royalties/parsers/` — alias-based column mapping per distributor, pandas-backed CSV/TSV/XLSX loading, Celery task triggered on upload. Header aliases for TooLost/FUGA/Vydia/The Orchard are best-effort and should be validated against real vendor exports.)*
- **DDEX ingestion** — industry standard for DSP/distributor data exchange
- **ISRC / UPC / ISWC storage and management** — core identifiers *(ISRC + UPC on catalog models today; ISWC not yet)*
- **Role-based access control (RBAC)** — Artist / Manager / Finance / A&R / Admin roles from day one *(implemented on catalog + royalties APIs and portal nav)*
- **Full data export (CSV + JSON)** — must be a first-class feature, not an afterthought *(shipped — role-scoped JSON/CSV export)*
- **Audit trail** — immutable log of all financial changes *(shipped — `AuditEvent` + `/activity` portal)*

### Data Standards to Support
- **DDEX** — distribution and royalty data exchange
- **CWR** — common works registration (publishing)
- **ISRC** — International Standard Recording Code
- **ISWC** — International Standard Musical Work Code
- **UPC/EAN** — release barcodes
- **CAE/IPI** — composer/publisher identifiers

### Integration Targets (by priority)
**Phase 1 (statement parsers):** DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, Vydia, The Orchard
**Phase 2 (API integrations):** FUGA, The Orchard, Merlin
**Phase 2 (payment rails):** Stripe, ACH/wire, international payments
**Phase 3 (PRO registration):** ASCAP, BMI, SESAC, SOCAN, SoundExchange
**Phase 3 (analytics):** Chartmetric API, Soundcharts API
**Phase 4 (sync):** DISCO integration or direct supervisor network

---

## Pricing Strategy

**Core principle:** Flat fee. Never a percentage of earnings.

**Recommended tier structure:**
- **Starter** — ~$49/mo or $499/yr — up to 10 artists, unlimited releases, core royalty accounting, artist portals
- **Growth** — ~$149/mo or $1,499/yr — up to 50 artists, publishing admin, contract management, analytics
- **Pro** — ~$349/mo or $3,499/yr — unlimited artists, API access, white-label portals, priority support
- **Enterprise** — Custom — distributors, aggregators, large independents

**Key pricing commitments to make publicly:**
- No percentage of royalties, ever
- Full data export included on all plans
- Cancel anytime, data accessible for 90 days post-cancellation
- Price lock guarantee for annual subscribers

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
| `README.md` | Repo quick start, service URLs, current module status |
| `marketing/` | Astro static site for usegoodfaith.com |
| `CLAUDE.md` | This file — project context for AI agents and collaborators |

---

## Instructions for AI Agents Working on This Project

1. **Always read this file first** before starting any task related to this project.
2. **The master report** (`docs/research/label_management_software_master_report.md`) is the source of truth for features and competitor intelligence.
3. **The 6 strategic gaps** are the north star — every product decision should address at least one of them.
4. **The primary ICP** is an indie label with 5–50 signed artists, multiple distributors, outgrowing spreadsheets. Design for them first.
5. **Pricing constraint:** Never propose a percentage-of-earnings model. Flat fee only.
6. **Trust is the #1 brand value.** Data portability, transparent pricing, and role-based access are non-negotiable.
7. When writing product copy, pull from the verbatim Reddit quotes in the Community Intelligence section — they are the exact language the market uses.
8. **Module build order:** Phase 1 complete. Phase 2: Stripe Connect, object storage, DDEX, contracts, publishing admin. See `docs/PHASE1.md`.
9. **Marketing vs portal:** `marketing/` is the public pre-launch site (`PRODUCT.md` governs copy/design). `frontend/` is the authenticated label portal. Do not add a waitlist form until Listmonk is configured.
10. **Financial data access:** Artist and A&R roles must never see royalty statements, splits, or payout data — enforce in API queryset filters and portal nav, not just UI hiding.
