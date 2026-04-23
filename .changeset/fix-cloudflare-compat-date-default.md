---
'@astrojs/cloudflare': patch
---

Fixes Cloudflare dev and build failures caused by `@cloudflare/vite-plugin` defaulting `compatibility_date` to today's date, which can exceed the maximum date supported by the bundled `workerd` binary
