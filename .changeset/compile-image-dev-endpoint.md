---
'@astrojs/cloudflare': patch
---

Fixes an issue where imageService: "compile" used the Cloudflare runtime transform endpoint in dev mode instead of the generic dev endpoint.

