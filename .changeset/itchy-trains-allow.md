---
'astro': patch
---

Fixes a case where setting the status of a page to `404` in development would show the default 404 page (or custom one if provided) instead of using the current page
