---
'astro': patch
---

Fixes a bug where `experimental.advancedRouting` with `astro/hono` handlers threw `TypeError: Cannot read properties of undefined (reading 'route')` for unmatched routes instead of rendering the custom 404 page.
