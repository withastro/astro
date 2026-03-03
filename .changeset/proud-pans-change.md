---
'@astrojs/cloudflare': patch
'@astrojs/netlify': patch
'@astrojs/vercel': patch
'astro': patch
---

Fixes a case where `build.serverEntry` would not be respected when using the new Adapter API
