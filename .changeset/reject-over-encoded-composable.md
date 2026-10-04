---
'astro': patch
---

Fixes the composable `astro/fetch` and `astro/hono` handlers (`trailingSlash()`, `middleware()`, and `pages()`) so they reject over-encoded request paths with a `400 Bad Request`, matching `astro()`
