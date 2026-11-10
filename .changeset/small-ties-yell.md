---
'astro': patch
---

Improves startup time of `astro` commands by loading SVGO only when `svgoOptimizer()` optimizes an SVG, instead of whenever `astro/config` is imported
