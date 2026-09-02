---
'@astrojs/cloudflare': patch
---

Fixes cold `astro dev` crashes by adding `astro/app/manifest` and `@astrojs/cloudflare/cache/provider` to the `optimizeDeps.include` list
