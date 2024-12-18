---
'astro': minor
---

Improves asset caching of remote images 

Astro will now store [entity tags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) and the [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) date for cached remote images and use them to revalidate the cache when it goes stale.
