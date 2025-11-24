---
'astro': patch
---

Fixes a case where setting the status of a page to `404` in ssr would show an empty page (or `404.astro` page if provided) instead of using the current page
