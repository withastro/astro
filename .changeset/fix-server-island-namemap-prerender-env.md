---
'astro': patch
---

Fixes a dev server crash (`serverIslandNameMap.get is not a function`) that occurred when navigating to a page with `server:defer` after first visiting a page without one, when using `@astrojs/cloudflare`
