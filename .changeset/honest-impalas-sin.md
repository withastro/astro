---
'@astrojs/cloudflare': patch
---

Fixes `imageService: "compile"` returning 400 Bad Request in dev when a user-provided `image.service` (e.g. `passthroughImageService()`) is configured
