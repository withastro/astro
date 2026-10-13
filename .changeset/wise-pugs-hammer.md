---
'@astrojs/cloudflare': patch
---

Fixes the `astro` peer dependency range, which allowed the adapter to be installed alongside Astro 7.2.x. Since v14.3.0 the adapter imports `renderForPrerender` from `astro/app`, an export added in Astro 7.3.0, so building against 7.2.x failed with `[MISSING_EXPORT] "renderForPrerender" is not exported by "node_modules/astro/dist/core/app/entrypoints/index.js"`. The range is now `^7.3.0`, so package managers resolve a compatible adapter version instead of installing one that cannot build.
