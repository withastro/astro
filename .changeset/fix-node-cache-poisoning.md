---
'@astrojs/node': patch
---

Fixes a cache poisoning vulnerability where conditional request errors (e.g. malformed `If-Match` header) returned immutable far-future cache headers, allowing CDN caches to serve error responses instead of static assets
