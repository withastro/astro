---
'@astrojs/cloudflare': patch
---

Fixes an issue where `vars` weren't available at build time. Now the adapter loads `vars` from the Wrangler config so `astro:env` public variables resolve at build time
