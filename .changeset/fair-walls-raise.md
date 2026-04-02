---
astro: patch
'@astrojs/cloudflare': patch
---

Fix passing `waitUntil` to `CacheProvider.onRequest()` when using the Cloudflare adapter.
