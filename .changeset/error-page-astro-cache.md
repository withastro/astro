---
'astro': patch
---

Fixes `Astro.cache` being `undefined` when a custom 404 or 500 page is rendered by the error handler, for example after a request to an API route with an HTTP method the route doesn't export
