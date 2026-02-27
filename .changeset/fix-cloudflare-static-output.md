---
'@astrojs/cloudflare': patch
---

Fixes deployment of static sites with the Cloudflare adapter

The adapter now correctly detects fully static sites and uses the appropriate build output mode. This prevents deployment errors when using `output: 'static'` with the Cloudflare adapter.