---
'@astrojs/cloudflare': minor
---

Sets immutable cache headers for static assets

Static assets under `_astro` can be cached to improve performance. The adapter now automatically injects a `Cache-Control` header at build time when possible.
