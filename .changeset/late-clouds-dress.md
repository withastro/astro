---
'astro': patch
---

Fixes the memory cache provider to skip responses with `Vary: Cookie` or `Vary: *`
