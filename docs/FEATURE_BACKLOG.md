# Feature backlog

Prioritized product opportunities for Good Faith after the Phase 1–3 core.
Items lean on gaps called out in `docs/PHASE2.md`, `docs/PHASE3.md`, and
`docs/research/record_label_software_feature_spec.md`, filtered for a
self-hosted, no-SaaS-billing label ops stack.

## P0 — Trust & finance depth (next)

| Feature | Why | Notes |
|---|---|---|
| Advances & recoupment ledger | Labels cannot close books without unrecouped balances | Opening balances, per-artist/release costs, auto-apply on runs |
| Contract-linked royalty terms | Splits alone miss escalations, territory rates, pre/post deductions | Start with rate tables + effective dates; AI PDF extract later |
| Multi-currency FX on runs | Distributors pay in mixed currencies | Rate table per period; payee payout currency |
| Artist statement PDFs (branded) | Artists expect downloadable period statements | Extend existing payout/run PDF export with branding |
| httpOnly session cookies | Token-in-`localStorage` remains XSS-sensitive | Prefer cookie auth + CSRF for the portal |

## P1 — Ops that win mid-market labels

| Feature | Why | Notes |
|---|---|---|
| Prospect activity timeline / notes thread | A&R pipeline only has a single notes field | Comments + stage-change audit |
| Auto-create roster artist on “signed” | Closes A&R → catalog handoff | Optional invite-at-sign |
| Sync pitch playlists + share links | Supervisors need listen links without DISCO lock-in | Signed share URLs; engagement later |
| Cue sheet export | Sync deals need delivery artifacts | CSV/PDF from opportunity + track credits |
| Marketing smart-link click ingest | Campaigns store URLs but no performance | Webhook/CSV import from Linkfire/Feature.fm |
| Obligation / option renewal dashboards | Contracts scaffold lacks ops surfacing | Options, expirations, open obligations |

## P2 — Catalog, DAM & publishing

| Feature | Why | Notes |
|---|---|---|
| Stem / alternate version nesting under tracks | DAM is flat today | Version tree on `DigitalAsset` |
| DDEX / CSV catalog ingest | Migration from distributors/CMS | Start with CSV; DDEX later |
| Duplicate merge tooling | Dirty catalogs from multi-distributor ingest | Artists/tracks/ISRCs |
| CWR / PRO registration export | Publishing scaffold needs delivery | ASCAP/BMI/SESAC packages |
| Catalog health checks | Missing ISRC/ISWC/UPC/splits | Dashboard + export of gaps |
| Authenticated media download URLs | Avoid guessable media paths outside DEBUG | Signed S3 or auth’d proxy always |

## P3 — Integrations (opt-in, self-hosted)

| Feature | Why | Notes |
|---|---|---|
| Chartmetric / Soundcharts analytics | Phase 3 deferred external analytics | Read-only API keys per label |
| FTP/SFTP statement auto-import | Curve-style daily pull | Celery beat + folder watch |
| Neighboring-rights / society statements | Broader income coverage | Parser pack expansion |
| Listmonk / email campaign hooks | Marketing without building a mailer | Webhook + templates |
| Stripe Connect / ACH push | Still deferred — mark-paid + CSV is default | Only if labels demand automated rails |
| Supervisor marketplace opt-in | DISCO-like discovery | Privacy-first; off by default |

## P4 — Collaboration & reporting polish

| Feature | Why | Notes |
|---|---|---|
| Custom report builder | Analytics starter is fixed slices | Saved queries + CSV |
| Scheduled email reports | Finance wants weekly digests | Celery + notification templates |
| Territory / DSP drill-downs | Line items have store/country already | UI + rollups |
| In-app @mentions / task assignment | Workflow module is light | Tie to existing notifications |
| Per-contract field-level permissions | Legal vs finance visibility | Extend RBAC beyond role gates |

## Explicit non-goals (for now)

- SaaS subscription billing, waitlists, or “book a demo” funnels
- Taking a cut of artist earnings
- Forcing a distributor switch
- Replacing DISCO/Synchtank wholesale before sync share links exist

## Suggested sequencing

1. Advances/recoupment + contract rate terms (finance completeness)
2. Cookie/session auth hardening follow-up
3. A&R timeline + signed→roster
4. Catalog health + DDEX/CSV ingest
5. Sync share links + cue sheets
6. External analytics / FTP import as optional add-ons
