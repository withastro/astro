---
"astro": patch
---

Fixes an issue where `ctx.site` included the configured `base` in API routes and middleware, unlike `Astro.site` in astro pages.
