---
'@astrojs/cloudflare': patch
---

Fixes fully static sites with a custom Worker entrypoint (`main` in the Wrangler config) being deployed without the Worker. The Worker bundle, including its Durable Object and other exports, is now built even when every page is prerendered.
