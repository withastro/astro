---
'@astrojs/cloudflare': patch
---

Fixes a build crash when a custom worker entrypoint exports Durable Object classes alongside prerendered pages. The prerender worker no longer inherits `durable_objects`, `migrations`, or `workflows` from the entry worker config.
