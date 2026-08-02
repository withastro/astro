---
'@astrojs/cloudflare': patch
---

Fixes `/_image` returning 500 in dev mode when using `imageService: 'custom'`. Astro's default dev image endpoint imports `vite` and `node:fs`, which cannot be loaded inside workerd. The `custom` and fallback cases now use the generic fetch-based endpoint in dev, matching the other image service modes. A user-configured `image.endpoint` is left untouched.
