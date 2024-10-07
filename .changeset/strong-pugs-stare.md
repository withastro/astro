---
'astro': patch
---

Skips setting statusMessage header for HTTP/2 response

HTTP/2 doesn't support status message, so setting this was logging a warning.
