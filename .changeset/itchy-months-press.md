---
'astro': patch
---

Passes the `Request` object to `CacheProvider.setHeaders()`

Cache providers now receive the incoming `Request` as a second argument to `setHeaders(options, request)`. This allows CDN providers to read the request URL, headers, and other properties when generating cache response headers, for example to auto-tag responses with their pathname for path-based invalidation.
