---
'astro': patch
---

Lazily import SVGO in `svgoOptimizer` to avoid loading SVGO and its dependencies when importing `astro/config`
