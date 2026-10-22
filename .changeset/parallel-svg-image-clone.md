---
'astro': patch
---

Fixes a `DataCloneError` crash when building pages that render SVG imports with `<Image />` or `getImage()` while `experimental.parallelPrerender` is enabled.
