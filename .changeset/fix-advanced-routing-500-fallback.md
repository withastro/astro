---
'astro': patch
---

Fixes a bug where `experimental.advancedRouting` with `astro/hono` handlers returned the host framework's default `Internal Server Error` response instead of rendering the custom `500.astro` page when a page threw during render.
