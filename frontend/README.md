## Frontend – Event Attendance System (EAS)

React 18 + Vite + Tailwind + shadcn/ui primitives (JavaScript only).

### Documentation

| Topic                 | Location                         |
| --------------------- | -------------------------------- |
| Architecture          | ../docs/frontend/architecture.md |
| Development Standards | ../docs/frontend/development.md  |
| Global Overview       | ../docs/overview.md              |

### Quick Start

```
cd frontend
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm run format`.

### Conventions

- Use `@` path aliases (no relative `../`). Aliases are configured in `vite.config.js` and `jsconfig.json`.
- Reuse primitives from `@/components/ui/`.
- Provide loading & error states for API-backed views.
- New component files must be kebab-case (legacy PascalCase primitives will be migrated later).

### Testing

Vitest + Testing Library are configured.

```
npx vitest
```

### Environment

`VITE_API_BASE_URL` (dev default via proxy: requests to `/api` are proxied to tunnel URL if `VITE_API_TUNNEL_URL` is set. Otherwise point directly to `http://localhost:8000/api/`).

### Auth Handling

Access & refresh tokens returned by backend SimpleJWT; current dev flow stores in `localStorage`. On 401 → logout + redirect.

Full API list: `../docs/backend/api.md`.
