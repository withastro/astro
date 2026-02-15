---
'astro': patch
---

Fixes a race condition in the dev server that could cause `TypeError: Missing parameter` errors when handling concurrent requests to dynamic routes. 
