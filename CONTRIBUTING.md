# Contributing to Good Faith

Thanks for helping improve Good Faith — whether you run a fork (for example [2RMusic/goodfaith](https://github.com/2RMusic/goodfaith)) or are new to the project.

## Before you start

- Read the [README](README.md) for product context and quick start.
- Security issues: follow [docs/SECURITY.md](docs/SECURITY.md) (do not open public issues for exploitable vulnerabilities).

## Local development

### Prerequisites

- Docker with Compose
- Git

### Setup

```bash
git clone https://github.com/tedrubin80/goodfaith.git
cd goodfaith
cp backend/.env.example backend/.env
docker compose up --build
```

| Service | URL |
|--------|-----|
| Portal | http://localhost:3020 |
| API | http://localhost:8020 |

Seed demo data:

```bash
docker compose exec backend python manage.py seed_label \
  --label-name "My Label" \
  --manager-username manager \
  --manager-password 'changeme' \
  --demo
```

More install detail: [docs/install/install.md](docs/install/install.md).

### Running tests locally

**Backend** (Postgres and Redis via Compose):

```bash
cp backend/.env.example backend/.env   # if not already done
docker compose up -d db redis
docker compose run --rm --no-deps backend python manage.py test --verbosity=1
```

**Frontend** (from `frontend/`):

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

CI runs the same checks on every pull request and on pushes to `main`.

## Branches and pull requests

1. Fork the repo (or use a feature branch if you are a collaborator).
2. Branch from `main` unless you are stacking on an open integration branch; name branches descriptively (for example `feature/colonize-export-fix`).
3. Keep PRs focused — one logical change per PR when possible.
4. Ensure **CI is green** before requesting review.
5. Describe **what** changed and **why** in the PR body. Link related issues when applicable.

### Migrations

- Django migrations live under `backend/apps/*/migrations/`.
- Include migrations in the same PR as model changes.
- Never edit applied migration files on `main`; add a new migration instead.
- After pulling, run `docker compose exec backend python manage.py migrate` (or `migrate` via your local backend).

## Code style

### Backend (Django / DRF)

- Match existing app layout under `backend/apps/`.
- Enforce **label- and role-scoped** access; finance-sensitive routes follow existing RBAC helpers.
- Prefer explicit permissions on views and serializers; add or extend tests in the app’s `tests.py` when behavior changes.
- Formatting is not automated in CI; follow neighboring files (imports, naming, thin views).

### Frontend (Next.js)

- App Router under `frontend/app/`; shared UI in `frontend/components/`, API helpers in `frontend/lib/`.
- Use existing `apiFetch` and auth helpers; avoid duplicating role checks.
- Run `npm run lint` and `npm run typecheck` before pushing.
- Avoid synchronous `setState` in `useEffect` for loading gates — use patterns like `lib/use-fetch-loading.ts` or derived state.

## Getting help

- Open a [GitHub Discussion](https://github.com/tedrubin80/goodfaith/discussions) or issue for questions.
- For 2RMusic-specific fork sync questions, coordinate in your PR so upstream can land compatible changes on `main`.