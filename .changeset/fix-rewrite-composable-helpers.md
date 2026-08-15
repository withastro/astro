---
'astro': patch
---

Fixes the composable request helpers (`astro/fetch`) throwing an error when used on a request that had been rewritten with `Astro.rewrite()` or `next()`
