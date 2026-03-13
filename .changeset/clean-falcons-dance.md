---
"@astrojs/cloudflare": patch
---

Fixes a bug where dependencies imported by prerender-only `server:defer` islands could remain as bare imports in server output, causing module resolution failures in preview and Cloudflare Workers.
