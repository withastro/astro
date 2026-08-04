---
'@astrojs/cloudflare': patch
---

Fixes a type-checking error when using `app.use(cf())` from `@astrojs/cloudflare/hono` in projects with `wrangler types`-generated `ExecutionContext` declarations
