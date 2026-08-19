---
'astro': patch
---

Fixes `astro build` throwing `TypeError: Missing parameter` for dynamic routes when `build.format: 'preserve'` and `trailingSlash: 'always'` are used together. Stripping the framework-injected `.html` suffix dropped the trailing slash that the compiled route pattern requires, so the route no longer matched itself and its params resolved as empty.
