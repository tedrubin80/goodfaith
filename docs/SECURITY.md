# Security notes

Hardening applied for multi-tenant label ops. Self-hosted operators still own
TLS termination, secrets, and network exposure.

## Fixed / enforced

- **Tenant ACL on royalties** — statement upload and run create validate label
  membership; statement/run identity fields are immutable after create.
- **ACH export** — finance roles only (artists can no longer download full-batch
  bank CSV via the API).
- **Payments + mandatory 2FA** — Manager/Finance/Admin must enable 2FA before
  payout endpoints (same gate as royalties/export).
- **Auth token rotation** — a new DRF token is issued on every successful login;
  password change and logout still revoke tokens.
- **Login / 2FA rate limits** — `20/min` IP throttles on login and 2FA verify
  (apply even if a stale token header is sent; those views disable auth).
- **Pre-2FA response** — password-OK + 2FA-required responses no longer include
  the user profile.
- **Password validators** — Django validators run on password change and artist
  invite.
- **Upload allowlists** — royalty statements, contracts, and DAM files check
  extension + size (`GFRM_MAX_UPLOAD_BYTES`, default 25 MB).
- **Production fail-closed** — insecure `DJANGO_SECRET_KEY` and missing
  `DJANGO_CACHE_URL` refuse to boot; SSL cookie flags and HSTS default on.
- **Parse errors** — unexpected statement parse exceptions are not echoed
  verbatim to clients.

## Remaining follow-ups

| Item | Severity | Direction |
|---|---|---|
| Auth token in `localStorage` | Medium | Prefer httpOnly Secure cookies + CSRF |
| TOTP secret plaintext at rest | Medium | Encrypt with Fernet/KMS |
| `setup_2fa` persists secret before confirm | Medium | Hold pending secret in cache until confirm |
| Authenticated media proxy outside DEBUG | Medium | Signed URLs or auth’d download views always |
| Spreadsheet DoS (zip bombs / huge sheets) | Medium | Row/byte caps inside pandas load |
| Django admin exposure | Low | Network restrict + staff MFA |

See also `docs/FEATURE_BACKLOG.md` (httpOnly sessions listed under P0).
