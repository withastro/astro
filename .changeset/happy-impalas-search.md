---
'@astrojs/cloudflare': patch
---

Fixes `astro build` failing with `ECONNREFUSED` on IPv6-first hosts by deriving the prerender server URL from the actual bound address instead of re-resolving `localhost`
