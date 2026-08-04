---
'@astrojs/cloudflare': patch
---

Fixes a crash on `/_image` cache hits when the Cloudflare cache provider is enabled. Responses served from the Workers Cache API have immutable headers, and the request handler crashed with "Can't modify immutable headers" when applying its default `Cloudflare-CDN-Cache-Control: no-store` header to them. The handler now rebuilds the response with mutable headers when needed.
