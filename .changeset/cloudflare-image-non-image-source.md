---
'@astrojs/cloudflare': patch
---

Fixes the `/_image` endpoint returning a 500 error when `href` points to a missing file or a file that isn't an image. It now responds with a 404 or 400 instead.
