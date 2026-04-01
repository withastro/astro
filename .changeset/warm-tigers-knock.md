---
'@astrojs/vercel': patch
---

Fixes edge middleware `next()` dropping the HTTP method and body when forwarding requests to the serverless function, which caused non-GET API routes (POST, PUT, PATCH, DELETE) to return 404
