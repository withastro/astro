---
'astro': patch
---

Fixes Vite dependency optimization discovering new dependencies mid-request in Cloudflare dev mode by including `.ts` and `.js` files in the server-side `optimizeDeps.entries` scan
