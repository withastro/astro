---
'astro': patch
---

Fix middleware for API endpoints that use `Response`.

Astro, will log a warning for endpoints that don't use `Response`. 
