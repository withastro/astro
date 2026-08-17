---
'astro': patch
---

Fixes an issue where Astro could go into out of memory when the `experimental.collectionStorage` is set to `chunked`, and there are multiple, concurrent updates to the same collection.
