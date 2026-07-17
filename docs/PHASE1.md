# Phase 1 — Complete

Phase 1 delivers a self-serve royalty pipeline for indie labels: **catalog → statements → splits → runs → payouts → export**, with RBAC, audit trail, and artist portal.

## Quick start (local)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

## First label (no Django admin required)

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'your-secure-password' \
  --demo
```

Sign in at http://localhost:3020/login with the manager credentials.

The `--demo` flag adds a sample artist, release, and track with ISRC/UPC for testing the royalty flow.

## End-to-end walkthrough

1. **Catalog** — Add artists, releases, tracks (ISRC on each track, UPC on release)
2. **Splits** — Create a finalized split sheet (100%) per track
3. **Royalties** — Upload distributor statements (CSV/TSV/XLSX); parser runs automatically
4. **Royalty run** — Select processed statements → New run → consolidation applies splits
5. **Payments** — Issue payout batch from run detail → Mark paid or **Export ACH CSV** for bank upload
6. **Activity** — Finance/Manager audit log of all financial actions
7. **Export** — Full label data as JSON or CSV (ZIP) anytime

## Role access

| Role | Access |
|---|---|
| Manager / Finance / Admin | Full label ops, royalties, payments, activity, export |
| A&R | Catalog read/write; no financial data |
| Artist | Own releases, splits, payouts; dedicated home dashboard |

## Production deploy

```bash
cp backend/.env.production.example backend/.env
# Edit secrets, DJANGO_ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, PORTAL_API_URL
docker compose -f docker-compose.prod.yml up --build -d
```

- API: Gunicorn on port 8020
- Portal: Next.js production build on port 3020
- Put nginx/Caddy in front with TLS; set `X-Forwarded-Proto: https`

## Phase 2 (deferred)

- Stripe Connect automated disbursement
- S3/R2 object storage for statements and DAM
- DDEX ingestion, ISWC, publishing admin
- Listmonk waitlist on marketing site

See `CLAUDE.md` for full module roadmap.
