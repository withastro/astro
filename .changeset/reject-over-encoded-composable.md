---
'astro': patch
---

Fixes the composable `astro/fetch` and `astro/hono` handlers (`trailingSlash()`, `redirects()`, `actions()`, `middleware()`, and `pages()`) so they reject over-encoded request paths with a `400 Bad Request`, matching `astro()`. For these requests, `redirects()` and `actions()` return the `400` response instead of `undefined`, so no redirect is issued and no action runs.
