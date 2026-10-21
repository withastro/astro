---
'astro': patch
---

Fixes type errors reported in Astro's built-in `<Image />`, `<Picture />`, `<Code />`, `<Debug />` and `<ClientRouter />` components when type-checking a project that extends `astro/tsconfigs/strictest` with `tsc` and `@astrojs/ts-content-mapper`
