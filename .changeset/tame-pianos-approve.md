---
'astro': patch
---

Fixes an issue where the use of `Astro.rewrite` would trigger the invalid use of `Astro.request.headers`
