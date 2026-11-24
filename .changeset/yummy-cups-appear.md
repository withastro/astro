---
'@astrojs/vercel': patch
---

Fixes cached responses leaking across URLs when using edge middleware. Requests that the edge middleware forwards to the serverless function now include the original path in the URL, so the Vercel CDN caches each path separately.
