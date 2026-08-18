---
'astro': patch
---

Fixes an issue where Astro could run out of memory when `experimental.collectionStorage` is set to `chunked` and there are multiple concurrent updates to the same collection.
