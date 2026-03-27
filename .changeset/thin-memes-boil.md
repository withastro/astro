---
'@astrojs/underscore-redirects': patch
---

Fixes generated redirect files to respect Astro’s `trailingSlash` configuration, so redirect routes work with the expected URL format in built output instead of returning a 404 when accessed with a trailing slash.
