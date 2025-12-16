---
'@astrojs/cloudflare': patch
---

Properly deploy static content in Cloudflare adapter

Fixes static content deployment by moving it to another folder, so Wrangler can tell the static and worker content apart.
