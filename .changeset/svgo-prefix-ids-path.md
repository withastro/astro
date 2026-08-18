---
'astro': patch
---

Fixes `experimental.svgOptimizer` not passing the file path to SVGO, so path-dependent plugins like `prefixIds` fell back to the same generic prefix for every SVG and IDs collided once multiple optimized SVGs were inlined on the same page.
