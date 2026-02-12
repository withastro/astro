---
'astro': patch
---

Fix config merging so `server.allowedHosts: true` stays a boolean instead of becoming `[true]`.
