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

- `CLAUDE.md` — project context, strategic gaps, ICP, pricing, module build order
- `docs/research/` — source research and feature/competitor analysis
  - `record_label_software_feature_spec.md` — 200+ feature catalog across 20 modules
  - `competitor_reddit_research.md` — competitor analysis + Reddit intelligence
  - `label_management_software_master_report.md` — master synthesis report
  - `label_management_software_report.pdf` — final PDF deliverable

## Status

Pre-implementation. Research and strategy are complete; source code has not been scaffolded yet. See `CLAUDE.md` for the planned module build order (Platform/Infrastructure → Catalog → Royalty Accounting → Splits → Payments → Artist Portals → ...).
