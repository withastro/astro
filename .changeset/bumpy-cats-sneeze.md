---
'astro': patch
---

Fixes an issue where requests with query parameters to the `base` path would return a 404 if trailingSlash was not 'ignore' in development
