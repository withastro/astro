---
'astro': patch
---

Fixes the `cache()` handler from `astro/hono` and `astro/fetch` throwing a `TypeError` when a cache provider is configured. It now registers the cache provider before rendering, so `Astro.cache` is available to downstream handlers like `pages()`.
