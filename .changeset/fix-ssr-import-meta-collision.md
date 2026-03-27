---
'@astrojs/cloudflare': patch
---

Fix HMR crash when editing content collection files caused by Vite's SSR transform colliding with zod v4's `meta` export
