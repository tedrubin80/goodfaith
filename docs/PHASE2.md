# Phase 2 — Platform Security & Metadata

Phase 2 adds trust and production infrastructure without changing the payment rails (Stripe Connect deferred until payment model is finalized).

## Shipped in Phase 2 (July 2026)

### Two-factor authentication (2FA)

TOTP authenticator apps (Google Authenticator, 1Password, Authy) with one-time backup codes.

| Role | 2FA policy |
|---|---|
| Manager / Finance / Admin | **Required** before royalties, splits, activity, or export |
| Artist / A&R | Optional |

**API**

| Endpoint | Description |
|---|---|
| `POST /api/auth/login/` | Returns `token` or `{ requires_2fa, pending_token }` |
| `POST /api/auth/2fa/verify/` | Complete login with TOTP or backup code |
| `POST /api/auth/2fa/setup/` | Start enrollment (returns QR + secret) |
| `POST /api/auth/2fa/confirm/` | Enable 2FA after verifying first code |
| `POST /api/auth/2fa/disable/` | Disable (Artist/A&R only) |

**Portal:** `/settings/security` — setup wizard, backup code display, mandatory-role banner.

### ISWC metadata

Tracks now store optional **ISWC** (International Standard Musical Work Code) alongside ISRC. Editable in release detail; included in full data export.

### S3-compatible object storage

Royalty statement uploads can target S3 or Cloudflare R2 when configured. Local `MEDIA_ROOT` remains the default for dev.

```bash
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_REGION_NAME=auto          # use "auto" for R2
AWS_S3_ENDPOINT_URL=https://...  # required for R2
```

Set `DJANGO_CACHE_URL=redis://redis:6379/1` for 2FA pending-login tokens (required in production multi-worker setups).

### Contracts (Module 6 — Phase 2 scaffold)

Label contract repository with artist linkage, term dates, notes, and optional PDF upload.

| Role | Access |
|---|---|
| Manager / A&R / Admin | Create and manage contracts |
| Finance | Read-only |
| Artist | Own contracts only |

**API:** `/api/contracts/` · **Portal:** `/contracts`

### Artist earnings portal

Track-level earnings from royalty runs without exposing label-wide financial data.

**API:** `GET /api/royalties/my-earnings/` · **Portal:** `/earnings` (artist role)

### Password change

**API:** `POST /api/auth/password/` · **Portal:** Security settings

### Artist portal invites

Managers/A&R can create Artist-role logins from the roster:

`POST /api/catalog/artists/{id}/invite/` → `{ username, password, email? }`

**Portal:** Artists page → **Invite** on unlinked roster entries.

### Publishing administration (Module 8 — scaffold)

Musical works with writer/publisher shares, ISWC, target PRO (ASCAP/BMI/SESAC/SOCAN), and registration status. Ready/submitted/registered requires shares totaling 100%.

| Role | Access |
|---|---|
| Manager / A&R / Admin | Create and manage works |
| Finance | Read-only |
| Artist | Works they share on (or recordings they own) |

**API:** `/api/publishing/works/` · **Portal:** `/publishing`

## Still deferred (Phase 2+)

- Stripe Connect + subscription billing *(payment model TBD)*
- DDEX ingestion / CWR filing automation
- Publishing depth (society API submission, ACK processing)
- Listmonk waitlist on marketing site
- Statement PDFs / notifications

See `CLAUDE.md` for the full module roadmap.
