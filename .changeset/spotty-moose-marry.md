---
'@astrojs/cloudflare': patch
---

Fixes `imageService: 'compile'` failing with `400 Bad Request (Unsupported format: null)` in `astro dev` when a custom `image.service` like `passthroughImageService()` is configured
