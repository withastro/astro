---
'astro': patch
---

Fixes dynamic routes returning 400 Bad Request when the URL contains a literal `%` character, such as paths built with `encodeURIComponent('%?.pdf')`
