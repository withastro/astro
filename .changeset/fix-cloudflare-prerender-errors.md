---
'@astrojs/cloudflare': patch
---

Fixes silent build failures and missing error overlay when using the Cloudflare adapter's default `workerd` prerenderer. Previously, rendering errors (e.g. missing imports) would silently produce truncated HTML with a successful build exit code, and in dev mode no error overlay would appear. Now builds properly fail with a clear error message, and dev mode shows the error overlay.
