---
'astro': patch
---

Fixes redirect `Location` header corruption when a route parameter value contains `$` replacement patterns (e.g. `$&`, `` $` ``, `$'`)
