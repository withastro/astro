---
'astro': patch
---

Fixes an unnecessary full page reload in `astro dev` when a content loader calls `store.clear()` or `store.delete()` and the content store has no asset imports
