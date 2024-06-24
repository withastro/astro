---
'astro': patch
---

Fixes an issue where custom `404.astro` and `500.astro` were not returning the correct status code when rendered inside a rewriting cycle.
