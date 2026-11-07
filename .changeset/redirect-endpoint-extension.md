---
'astro': patch
---

Fixes a redirect to an endpoint with a file extension (e.g. `/feed.xml`) getting a trailing slash and returning a 404 when `trailingSlash` is set to `'always'`
