---
'astro': patch
---

Fixes an uncaught `TypeError` in the browser when a `server:defer` island request fails due to a network error. The fallback content is kept, as it is for non-200 responses.
