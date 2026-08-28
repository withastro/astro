---
'astro': patch
---

Fixes `Astro.logger` and `context.logger` producing no output during `astro dev` with adapters that run in a non-runnable environment, such as `@astrojs/cloudflare`
