---
'astro': patch
'@astrojs/cloudflare': patch
---

Move Astro runtime `optimizeDeps` entries from the Cloudflare adapter into Astro core feature plugins so deps are only prebundled when those features are used.
