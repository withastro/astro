---
'astro': patch
---

Fixes a bug where the dev server stripped the configured `base` from URLs that only share a prefix with it. With `base: '/s'`, requests to `/src/...` were rewritten to `/rc/...` and failed, breaking those pages during development.
