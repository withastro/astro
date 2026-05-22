---
'astro': patch
---

Populates styles in the SSR manifest for prerendered routes. Previously, prerendered routes had `styles: []` in the manifest, making it impossible for workers or middleware to discover which CSS files a prerendered page uses.
