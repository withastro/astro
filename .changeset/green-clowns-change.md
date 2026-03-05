---
'@astrojs/cloudflare': patch
'@astrojs/vercel': patch
'astro': patch
---

Fixes an issue where the computed `clientAddress` was incorrect in cases of a Request header with multiple values.
