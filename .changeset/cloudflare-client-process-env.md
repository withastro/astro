---
'@astrojs/cloudflare': patch
---

Fixes `process is not defined` errors in client-side scripts and islands that reference `process.env`. The adapter's `process.env` define now applies only to the server output, so browser builds get Vite's default replacement.
