---
'@astrojs/ts-plugin': patch
---

Fixes "Go To References" from `.ts` files missing usages inside `.astro` files that are reached through `Astro.locals` (or that import nothing). The plugin now includes tsconfig-matched `.astro` files in the TypeScript program and injects Astro's ambient types so type chains like `Astro.locals.utils.toUpper()` resolve.
