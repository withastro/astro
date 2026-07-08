---
'@astrojs/cloudflare': patch
---

Prebundles `astro/components` and the `<ClientRouter />` transition runtime modules in the dev server environment so pages using them no longer trigger a mid-session dep optimizer reload, which caused React "Invalid hook call" errors in islands on the first request after a cold cache
