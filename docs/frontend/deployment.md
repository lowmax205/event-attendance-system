# Frontend Deployment (GitHub Pages)

This guide explains how to deploy the React (Vite) frontend to GitHub Pages.

## Prerequisites

- GitHub repository
- GitHub Pages set to “GitHub Actions” in Settings → Pages

## Repo configuration (already in place)

- GitHub Actions workflow: `.github/workflows/frontend-pages.yml`
  - Manual run (`workflow_dispatch` only)
  - Builds with `VITE_BASE_PATH="/"` for a custom root domain
  - Publishes `frontend/dist` to Pages
- SPA routing fallback
  - `public/404.html` redirect
  - `public/.nojekyll`
- Vite config uses `VITE_BASE_PATH` (defaults to `/`) and aliases via `@`

## Build-time environment variables

Set repository secrets (Actions → Secrets and variables → Actions → New repository secret):

- `VITE_API_BASE_URL` → your backend API origin (e.g., `https://eas-university.onrender.com`)
- `VITE_BASE_PATH` is injected by the workflow. For a root custom domain, it’s `/`.

## Deploy steps

1. Configure Pages source

- Repo → Settings → Pages → Build and deployment → Source: GitHub Actions

2. Run the workflow

- Repo → Actions → “Deploy Frontend to GitHub Pages” → Run workflow

3. Set a custom domain

- Repo → Settings → Pages → Custom domain: `easuniversity.site`
- Ensure DNS points your domain to GitHub Pages.

4. Verify custom domain ownership (TXT record)

If GitHub requests DNS verification, add this TXT record with your DNS provider and wait for propagation (up to 24 hours):

1. Hostname: `_github-pages-challenge-lowmax205.easuniversity.site`
2. Value: `07a63f3f7594299197d6b48043ab11`
3. TTL: default (or as low as allowed)

## Post-deploy verification

- Frontend loads at `https://easuniversity.site`
- Network calls hit: `${VITE_API_BASE_URL}/api/v1/...`
- Deep links work (SPA fallback) on refresh and direct visits.

## Switching environments

- For local dev: set `frontend/.env.local`:
  - `VITE_API_BASE_URL=http://localhost:8000`
  - `VITE_BASE_PATH=/`
- For GitHub Pages custom domain: workflow already uses `/`.
- For project pages under a subpath (if ever): set `VITE_BASE_PATH=/REPO_NAME/` at build time.

## Troubleshooting

- 404 on deep links: ensure `public/404.html` exists and workflow publishes `dist`.
- Mixed content errors: use HTTPS in `VITE_API_BASE_URL`.
- CORS errors: ensure backend `CORS_ALLOWED_ORIGINS` includes your pages URL (e.g., `https://easuniversity.site`).

---

See also: `frontend/README.md`, `docs/frontend/development.md`, `docs/overview.md`.
