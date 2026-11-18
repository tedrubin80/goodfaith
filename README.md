# Good Faith Record Management

**Open-source, self-hosted label management** for indie labels outgrowing spreadsheets.

Consolidate royalty statements from every distributor you already use. Run splits and payouts with role-based portals. Export everything anytime. **No cut of your earnings. No SaaS subscription billing.**


---

## Why it exists

Indie labels (roughly 5–50 artists) live in Google Sheets until multi-distributor royalties break the spreadsheet. Existing tools either force a distributor switch, take a percentage of earnings, or are scoped for DIY solo artists or enterprise teams.

Good Faith is the mid-market ops stack you run **yourself**.

### What you get

| Capability | What it means |
|---|---|
| **Distributor-agnostic royalties** | Ingest DistroKid, TuneCore, CD Baby, Symphonic, ONErpm, RouteNote, TooLost, FUGA, Vydia, The Orchard, **Colonize Media**, and other/custom (`other`) statements (CSV, TSV, TXT, XLS, XLSX) |
| **ISRC matching & track assets** | Primary track ISRCs plus **additional ISRCs** per recording (e.g. music-video ISRCs); imports reconcile lines to catalog tracks and record `source_asset_kind` on line items |
| **Track royalty drill-down** | Per-track royalty totals and breakdowns by statement and asset (API + catalog UI) |
| **Splits → runs → payouts** | Finalize 100% sheets, consolidate statements, mark paid / export ACH CSV |
| **Role-based portals** | Artist / Manager / Finance / A&R — finance data stays off A&R desks |
| **Catalog & rights** | Artists, releases, tracks (ISRC/ISWC/UPC), **featured artists** on tracks, contracts, publishing works |
| **Ops modules** | A&R pipeline, sync licensing, marketing campaigns, analytics, export, audit |
| **Trust defaults** | 2FA for financial roles, immutable activity log, full JSON/CSV export |

### Catalog & royalty details

- **Track identifiers** — Managers attach extra ISRCs to a track (`audio`, `music_video`, `other`, or `unknown` asset kind). During statement import, rows match the principal track ISRC or any label-scoped additional identifier (label-isolated; no cross-tenant bleed).
- **Featured artists** — `TrackArtist` links roster artists to tracks with primary/featured roles (tenant-checked on create and update).
- **Colonize Media** — Dedicated column aliases; **Excel** files use header-row detection (scans the first rows for ISRC/title + revenue columns when the header is not on row 1). Requires **`openpyxl`** (see `backend/requirements.txt`).
- **Publishing** — Work contributors include a **`writer_composer`** (Writer/Composer) role.
- **Statement line items (API)** — `GET /api/royalties/statements/{id}/line_items/` returns a **paginated** object, not a bare array:

  `?page=` (default `1`), `?page_size=` (`50` | `100` | `250` | `500`; invalid sizes fall back to `50`).

  ```json
  {
    "results": [ /* line items */ ],
    "count": 0,
    "page": 1,
    "page_size": 50,
    "total_pages": 1
  }
  ```

- **Track royalties (API)** — `GET /api/catalog/tracks/{id}/royalties/` (royalties permission + 2FA): totals and breakdown by statement and by asset ISRC/kind.

---

## Quick start (local)

```bash
git clone https://github.com/tedrubin80/goodfaith.git
cd goodfaith
cp backend/.env.example backend/.env
docker compose up --build
```

Compose runs Postgres, Redis, Django, Celery, and Next.js with **`restart: unless-stopped`** on each service.

| | URL |
|---|---|
| Portal (`/` → login) | http://localhost:3020 |
| Install / health page | http://localhost:3020/install |
| API | http://localhost:8020 |
| Health | http://localhost:8020/api/health/ |

The frontend container sets **`NEXT_PUBLIC_API_URL=http://localhost:8020`** (browser calls the mapped API port). Running Next.js outside Docker: same value in the environment, or rely on the default in `frontend/lib/api.ts` (`http://localhost:8020`).

Seed a label and sign in:

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'changeme' \
  --demo
```

→ http://localhost:3020/login

More detail: [`docs/install/install.md`](./docs/install/install.md) (volumes, `docker compose down`, prod compose file).

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
backend/          Django + DRF API, Celery, migrations (pandas + openpyxl for statements)
frontend/         Next.js portal (/ → login; /install for local setup)
docs/install/     Install & deploy guides
docs/PHASE*.md    Product phase notes
docs/SECURITY.md  Multi-tenant hardening notes
railway.toml      Railway API template
railway.worker.toml
frontend/vercel.json
```

---

## Status

- **Phase 1** — Royalty pipeline end-to-end (catalog, statements, splits, payouts, export, audit)
- **Phase 2** — 2FA, S3/R2, contracts & publishing scaffolds, statement PDFs, in-app notifications
- **Phase 3** — A&R, analytics, sync, marketing campaigns (more ops modules in progress)

Deep context: [`docs/FEATURE_BACKLOG.md`](./docs/FEATURE_BACKLOG.md) · Research: [`docs/research/`](./docs/research/)

---

## Contributing

Issues and PRs welcome. Keep changes focused; match existing Django/Next patterns and RBAC rules (role-scoped, label-scoped data).

```bash
# Backend tests
cd backend && python manage.py test

# Frontend (TypeScript + production build)
cd frontend && npx tsc --noEmit && npm run build
```

**Acknowledgments:** Catalog and royalty improvements including track assets, Colonize support, featured artists, statement pagination, and the track royalty detail view were contributed via the [2RMusic/goodfaith](https://github.com/2RMusic/goodfaith) fork and integrated into upstream.

---