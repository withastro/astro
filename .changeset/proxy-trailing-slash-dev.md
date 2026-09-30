---
'astro': patch
---

Fixes `vite.server.proxy` requests being rejected with the trailing-slash mismatch page in `astro dev` when `trailingSlash` is `'always'` or `'never'`. Proxied URLs are now forwarded without trailing slash checks.
