---
'astro': patch
---

Fixes SSR manifest placeholder not being replaced when the server build is minified, which caused a runtime `Invalid URL` crash at server boot
