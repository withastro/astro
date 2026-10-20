---
'astro': patch
---

Fixes `memoryCache()` serving an empty body for cached pages that return an empty `404` or `500` response. These responses now render the `404` or `500` error page on every request.
