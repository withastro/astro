---
'@astrojs/cloudflare': patch
---

Fixes the passthrough `/_image` endpoint returning a 404 instead of `304 Not Modified` when the browser revalidates a cached local image with `If-None-Match`. Revalidation supports weak ETags, tag lists, and wildcard conditions for local and allowed remote images while preserving image-type validation.
