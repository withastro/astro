---
'@astrojs/cloudflare': patch
---

Fixes fully static sites with a custom `worker.entrypoint` in `cloudflare.config.ts` silently dropping the Worker from the build output. The Worker bundle and its exports are now emitted, while pages remain prerendered and served from assets.
