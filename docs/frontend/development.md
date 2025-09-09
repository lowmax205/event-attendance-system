# Frontend Development Standards

## Core Rules

1. Only `@` path aliases (no relative `../`).
2. JavaScript only – no TypeScript or declaration files.
3. Reuse primitives; never duplicate (`modal`, `button`, etc.).
4. Provide loading, empty & error states for data views.
5. Keep components focused (<150 lines ideal) & extract logic to hooks.

## Data & Auth

All HTTP calls go through `api-service.js`. On 401 → logout & redirect login. Refresh flow (if implemented) should rotate tokens; currently simple retry + logout pattern.

## UI

Compose primitives; avoid ad-hoc `<div>` stacks. Extend variant logic inside primitive files only.

## Styling

Tailwind tokens only (semantic utilities). Avoid hard-coded hex values.

## Performance

- Route-level code splitting.
- Memoize heavy calculations.
- Debounce rapid API-triggering inputs.

## Testing

`vitest` + `@testing-library/react`. Mock `apiService` network interactions; import real primitives. Test env is `jsdom` and setup is configured in `vitest.config.js`.

## Migration Note

Do not add new PascalCase filenames; legacy ones remain until coordinated refactor.
