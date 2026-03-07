---
'@astrojs/cloudflare': patch
---

Fixes image serving in `passthrough` mode by using the Cloudflare `ASSETS` binding instead of generic fetch, which does not work in Workers for local assets
