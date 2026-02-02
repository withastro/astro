---
'@astrojs/cloudflare': patch
---

Adds deprecation errors for `Astro.locals.runtime` properties to help migrate from Astro v5 to v6

When accessing the removed `Astro.locals.runtime` properties on Cloudflare, developers now receive clear error messages explaining the migration path:

- `Astro.locals.runtime.env` → Use `import { env } from "cloudflare:workers"`
- `Astro.locals.runtime.cf` → Use `Astro.request.cf`
- `Astro.locals.runtime.caches` → Use the global `caches` object
- `Astro.locals.runtime.ctx` → Use `Astro.locals.cfContext`