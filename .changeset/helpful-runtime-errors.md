---
'@astrojs/cloudflare': patch
---

Adds helpful deprecation errors for `Astro.locals.runtime` properties

When accessing the removed `Astro.locals.runtime` properties, developers now receive clear error messages explaining the migration path:

- `Astro.locals.runtime.env` → Use `import { env } from "cloudflare:workers"`
- `Astro.locals.runtime.cf` → Use `Astro.request.cf`
- `Astro.locals.runtime.caches` → Use the global `caches` object
- `Astro.locals.runtime.ctx` → Use `Astro.locals.cfContext`

This improves the migration experience from Astro v5 to v6 by providing actionable guidance instead of cryptic undefined property errors.