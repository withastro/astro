---
'astro': patch
---

Fixes `astro:env/server` failing to load in development when an environment variable contains `$` sequences such as `` $` `` or `$&`
