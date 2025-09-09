# Contributing Guide

## Workflow

1. Branch from `main` using a short, kebab-case name (e.g., `feat/events-filters`).
2. Implement atomic changes (single concern per commit).
3. Add/update tests for behavioral changes.
4. Update relevant `docs/` file(s) + root README if high-level view changes.
5. Ensure no forbidden patterns (frontend: relative imports, duplicate primitives; backend: missing permissions).
6. Follow `.github/instructions/` rules (global + backend/frontend specifics).

## Conventional Commits

`feat:` new feature | `fix:` bug | `docs:` docs only | `refactor:` internal | `test:` tests | `chore:` tooling | `perf:` performance | `ci:` pipeline.

## PR Checklist

- [ ] CRUD complete (if new model)
- [ ] Permissions enforced
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] No relative imports (frontend)
- [ ] No duplicated primitives
 - [ ] API surface documented in `docs/backend/api.md` if routes changed
 - [ ] Screens/UX have loading + error states (frontend)

## Clarifications

Unsure about endpoint shape / primitive existence? Ask—never invent. Defer to:

- `.github/instructions/copilot-instructions.md` (global)
- `.github/instructions/backend-crud.instructions.md`
- `.github/instructions/frontend-theme.instructions.md`

## Local Verification

Backend (Windows PowerShell):

```
cd backend
python -m pip install -r requirements.txt
python manage.py migrate --settings=config.development
python manage.py runserver --settings=config.development
```

Tests (backend):

```
cd backend
python -m pytest -q
```

Frontend:

```
cd frontend
npm install
npm run dev
```

Lint/format:

```
cd frontend
npm run lint; npm run format:check
```
