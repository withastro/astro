---
'astro': patch
---

Fixes `context.props` being `null` in middleware and endpoints when the composable `astro/hono` or `astro/fetch` `actions()` handler runs before `middleware()`, or when `pages()` runs without `middleware()`
