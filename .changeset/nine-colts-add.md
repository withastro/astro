---
'astro': patch
'@astrojs/internal-helpers': patch
---

Fixes base path stripping to respect path-segment boundaries. With a configured `base` such as `/docs`, a request like `/docs-archive/page` is no longer treated as being under the base, so routing and `context.url.pathname` now agree on the same pathname.
