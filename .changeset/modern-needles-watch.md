---
'@astrojs/cloudflare': patch
---

Preserves original image files referenced directly in pages in `dist/client/_astro/` when using the Cloudflare adapter's `imageService: 'compile'` or `'cloudflare-binding'` with `output: 'static'`