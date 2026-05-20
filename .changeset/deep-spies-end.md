---
'astro': patch
---

Populates external stylesheet URLs in the SSR manifest for prerendered routes. Previously, prerendered routes had `styles: []` in the manifest, making it impossible for workers or middleware to discover which CSS files a prerendered page uses. Inline styles are still omitted since they are already baked into the prerendered HTML.
