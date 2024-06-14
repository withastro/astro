---
'astro': patch
---

Adds a new error `RewriteWithBodyUsed` that throws when `Astro.rewrite` is used after the request body has already been read.
