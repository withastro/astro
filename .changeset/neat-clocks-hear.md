---
'astro': patch
---

Fixes JSON and Node loggers crashing with `process is not defined` in non-Node runtimes like Cloudflare's workerd
