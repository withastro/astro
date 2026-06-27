---
'astro': patch
---

Fixes trailing slash handling for dynamic file endpoints in dev mode

Dynamic file endpoints (e.g., `src/pages/api/[name].json.ts`) with `trailingSlash: "always"` incorrectly required a trailing slash in dev mode, returning 404 for `/api/bar.json` and 200 for `/api/bar.json/`. This was because `trailingSlashForPath` relied on `pathname`, which is `null` for dynamic routes, causing it to skip the file extension check. The fix uses the route string (from `joinSegments`) as a fallback, which preserves file extensions even for dynamic segments.
