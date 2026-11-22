---
'@astrojs/cloudflare': patch
---

Fixes prerendered pages returning a 404 in `astro dev` when using a custom worker entrypoint with `cf()` from `@astrojs/cloudflare/fetch`
