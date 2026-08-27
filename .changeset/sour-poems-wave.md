---
'@astrojs/sitemap': patch
---

Fixes the sitemap outputting a URL with an empty path for the homepage (e.g. `https://example.com` instead of `https://example.com/`) when `trailingSlash` is set to `"never"` or `build.format` is set to `"file"`
