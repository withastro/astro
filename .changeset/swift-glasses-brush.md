---
'@astrojs/ts-plugin': patch
---

Fixes "Go To References" from `.ts` files missing usages inside `.astro` files that are reached through `Astro.locals`. The plugin now injects Astro's ambient types so type chains like `Astro.locals.utils.toUpper()` resolve, matching the language server.
