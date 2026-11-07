---
'astro': patch
---

Improves startup time of every `astro` command by loading SVGO only when an SVG is optimized, instead of whenever `astro/config` is imported
