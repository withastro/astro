---
'@astrojs/appwrite': minor
---

Adds `@astrojs/appwrite`, the Appwrite CDN cache provider for route caching. `cacheAppwrite()` maps `Astro.cache.set()` and `routeRules` onto the `Appwrite-CDN-Cache-Control` and `Appwrite-CDN-Cache-Key` headers, and implements `cache.invalidate()` as a cache key or path purge through the Appwrite API. Appwrite Sites runs Astro through `@astrojs/node`, which stays the adapter.
