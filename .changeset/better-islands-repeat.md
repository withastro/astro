---
'astro': patch
---

Fixes an intermittent dev server crash when using `astro:actions` inside a server island with adapters that use a pre-bundled SSR environment (e.g. `@astrojs/cloudflare`)
