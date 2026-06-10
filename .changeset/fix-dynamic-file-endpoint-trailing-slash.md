---
'astro': patch
---

Fixes trailing slash handling for dynamic file endpoints in dev mode.

Dynamic file endpoints (e.g., `src/pages/api/[name].json.ts`) with `trailingSlash: "always"` incorrectly required a trailing slash in dev mode, while the production build correctly treated them without one. This was because the `trailingSlashForPath` function relied on `pathname`, which is `null` for dynamic routes, causing the file extension check to be skipped.
