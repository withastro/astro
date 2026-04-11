---
'astro': patch
'@astrojs/cloudflare': patch
---

Fixes issue where `server.allowedHosts` were ignored when using `astro preview` with the `@astrojs/cloudflare` adapter.
