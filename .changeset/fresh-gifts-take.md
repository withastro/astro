---
'@astrojs/internal-helpers': patch
'astro': patch
---

Improves the detection of remote paths in the `_image` endpoint. Now `href` parameters that start with `//` are considered remote paths.
