# CLAUDE.md — Label Management Software Project

> This file provides full context for any AI agent, developer, or collaborator picking up this project.
> Last updated: July 4, 2026.

---

## Project Overview

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

## Key Technical Decisions & Architecture Notes

### Must-Have at Launch
- **Multi-distributor statement parser** — the core moat. Must handle CSV/TSV/XLSX formats from DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, The Orchard. Auto-detect format. Normalize to internal schema.
- **DDEX ingestion** — industry standard for DSP/distributor data exchange
- **ISRC / UPC / ISWC storage and management** — core identifiers
- **Role-based access control (RBAC)** — Artist / Manager / Finance / A&R / Admin roles from day one
- **Full data export (CSV + JSON)** — must be a first-class feature, not an afterthought
- **Audit trail** — immutable log of all financial changes

### Data Standards to Support
- **DDEX** — distribution and royalty data exchange
- **CWR** — common works registration (publishing)
- **ISRC** — International Standard Recording Code
- **ISWC** — International Standard Musical Work Code
- **UPC/EAN** — release barcodes
- **CAE/IPI** — composer/publisher identifiers

### Integration Targets (by priority)
**Phase 1 (statement parsers):** DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote
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
8. **Module build order:** Platform/Infrastructure → Catalog → Royalty Accounting → Splits → Payments → Artist Portals → Contracts → Publishing Admin → Distribution → Analytics → everything else.
