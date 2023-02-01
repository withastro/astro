---
'astro': patch
---

* safe guard against TextEncode.encode(HTMLString) [errors on vercel edge]
* safe guard against html.replace when html is undefined