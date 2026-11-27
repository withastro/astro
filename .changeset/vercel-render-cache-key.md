---
'@astrojs/vercel': patch
---

Fixes pages served through edge middleware sharing one CDN cache entry. With `edgeMiddleware: true` and the `cacheVercel()` provider, the first page to call `Astro.cache.set()` was returned for every path rendered by the serverless function, including routes excluded from ISR and pages that never set a cache. Each path now gets its own cache entry.
