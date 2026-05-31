---
'@astrojs/cloudflare': patch
---

Fixes the default `imageService` for static output mode. Previously, the default `cloudflare-binding` image service generated `/_image?href=...` runtime URLs that returned 404 when deployed, since there is no server runtime to handle image transformation requests in static mode. The default now automatically uses `compile` for static output, which generates optimized image files at build time.
