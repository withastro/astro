---
'@astrojs/cloudflare': patch
---

Fixes `/_image` returning 500 in dev mode when using `imageService: 'custom'` (or an unrecognized image service value). The default Astro dev image endpoint imports `vite` and `node:fs/promises`, which are unavailable in workerd. The `custom` and `default` cases in `setImageConfig` now use the generic (fetch-based) endpoint in dev mode, matching the other image service modes.
