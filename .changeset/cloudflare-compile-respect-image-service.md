---
'@astrojs/cloudflare': patch
---

Fixes build-time image generation in the Cloudflare adapter so a custom `image.service` is respected in `imageService: 'compile'` mode, and extends `imageService: 'custom'` to also generate optimized image assets at build time.
