---
'astro': patch
---

The `routingStrategy` `prefix-always` should not force its logic to endpoints. This fixes some regression with `astro:assets` and `@astrojs/rss`.
