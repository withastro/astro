---
'@astrojs/cloudflare': patch
---

Fixes `optimizeDeps.include` glob `astro/runtime/**` matching `.d.ts` files, which caused 83 unnecessary optimizer entries and empty output chunks per environment during dev
