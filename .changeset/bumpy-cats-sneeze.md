---
'astro': patch
---

Fixes an issue where requests with query parameters to the base path would return a 404 error in dev mode when `trailingSlash` is set to `'never'` or `'always'`. The `baseMiddleware` now ensures URLs always start with `/` after stripping the base path, preserving query parameters for proper route matching.
