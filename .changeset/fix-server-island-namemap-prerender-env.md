---
'astro': patch
---

Fixes `serverIslandNameMap.get is not a function` error in dev when visiting a page with a server island after first visiting a page without one, when using an adapter (like `@astrojs/cloudflare`) that adds a separate `prerender` Vite environment.
