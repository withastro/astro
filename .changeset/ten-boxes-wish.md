---
'astro': patch
---

Fixes `Astro.cache.set()` calls in layouts and components being ignored by runtime cache providers such as `memoryCache()` when they run after rendering has awaited
