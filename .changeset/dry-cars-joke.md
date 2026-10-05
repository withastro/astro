---
'astro': patch
---

Fixes the composable `i18n()` handler from `astro/fetch` and `astro/hono` returning an empty 404 for paths without a locale prefix. It now renders the custom 404 page, matching `astro()`.
