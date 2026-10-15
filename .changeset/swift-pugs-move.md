---
'astro': patch
---

Fixes a `PARSE_ERROR` during `astro build` when a page imports a value from `astro.config.mjs` (or any module that imports `astro/config`)
