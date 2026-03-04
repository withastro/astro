---
'@astrojs/cloudflare': patch
---

Fixes deployment of static sites with the Cloudflare adapter

Fixes an issue with detecting and building fully static sites that caused deployment errors when using `output: 'static'` with the Cloudflare adapter