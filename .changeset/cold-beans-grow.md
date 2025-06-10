---
'astro': patch
---

Adds a new option to the CSP called `strategy`. When `strategy` is set to `auto`, the hashes of dynamic pages will be served using the `Response` headers.
