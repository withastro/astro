---
'astro': patch
---

Fixes `Astro.url.pathname` to respect `trailingSlash: 'never'` configuration when using a base path. Previously, the root path with a base would incorrectly return `/base/` instead of `/base` when `trailingSlash` was set to 'never'.
