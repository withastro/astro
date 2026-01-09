---
'astro': patch
---

Fixes a case where `context.cookies.set()` would be overriden when setting cookies via response headers in development
