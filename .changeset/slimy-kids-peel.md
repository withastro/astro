---
'astro': patch
---

Fixes an issue where the edge middleware couldn't correctly compute the client IP address when calling `ctx.clientAddress()`
