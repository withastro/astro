---
'@astrojs/cloudflare': patch
---

Fixes a dev-mode crash loop in the Cloudflare adapter when using Starlight by excluding `@astrojs/starlight` from SSR dependency optimization
