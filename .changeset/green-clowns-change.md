---
'@astrojs/cloudflare': patch
'@astrojs/vercel': patch
'astro': patch
---

Fixes an issue where the computed `clientAddress` was incorrect in cases of a Request header with multiple values. The `clientAddress` is now also validated to contain only characters valid in IP addresses, rejecting injection payloads.
