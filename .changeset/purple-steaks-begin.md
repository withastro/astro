---
'astro': patch
---

Avoid generating `req.url` without the starting `/` by the internal base middleware.
