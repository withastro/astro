---
'@astrojs/cloudflare': patch
---

Fixes the `@astrojs/cloudflare/hono` usage example so `i18n()` is mounted before `pages()`. In the old order, `i18n()` never ran, so locale redirects and fallbacks were skipped.
