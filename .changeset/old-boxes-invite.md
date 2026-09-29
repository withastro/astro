---
'astro': patch
---

Fixes nondeterministic ordering of the server manifest's `assets` array, ensuring builds with identical inputs produce byte-identical output
