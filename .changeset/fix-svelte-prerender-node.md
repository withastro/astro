---
'@astrojs/cloudflare': patch
'@astrojs/svelte': patch
---

Fixes `.svelte` files in `node_modules` failing with `Unknown file extension ".svelte"` when using the Cloudflare adapter with `prerenderEnvironment: 'node'`
