---
'@astrojs/cloudflare': patch
---

Fixes the `/_image` endpoint responding with a 500 error instead of a 404 when the source image is missing, or when a remote image host responds with an error status
