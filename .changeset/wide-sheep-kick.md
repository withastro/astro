---
'astro': patch
'@astrojs/cloudflare': patch
---

Fixes dev server crashes with the Cloudflare adapter by pre-including renderer server entrypoints and the default console logger in `optimizeDeps`, so they are bundled during the initial optimization pass instead of being discovered mid-request (which rewrote the optimized dependency chunks while workerd still referenced the old paths).