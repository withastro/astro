---
'astro': patch
---

Fixes a regression in `astro dev` where writes outside the module graph (for example, `@astrojs/cloudflare`'s `.wrangler/state` files) invalidated the middleware on every request, causing repeated SSR reloads. Such writes no longer invalidate the middleware.