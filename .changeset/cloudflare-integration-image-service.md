---
'@astrojs/cloudflare': patch
---

Fixes build-time image optimization ignoring a custom image service registered by an integration

Previously, when using `imageService: 'compile'` or `imageService: 'custom'`, a custom image service was only respected if it was set directly in the `image.service` option of `astro.config`. If an integration registered the service instead, images were silently optimized with the default Sharp service at build time. A custom image service now transforms your images at build time no matter how it was configured.
