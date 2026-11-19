---
'astro': patch
---

Fixes `memoryCache()` returning a 500 error when serving a cached 204, 205 or 304 response
