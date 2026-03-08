---
"@astrojs/cloudflare": patch
---

Fixes fully static sites to not output server-side worker code. When all routes are prerendered, the `_worker.js` directory is now removed from the build output.
