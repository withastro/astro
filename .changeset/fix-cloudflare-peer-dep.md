---
'@astrojs/cloudflare': patch
---

Fixes the `astro` peer dependency range from `^7.0.0` to `^7.2.0`. The adapter imports symbols (`beginContentEntryCollection`, `beginImageCollection`, `endContentEntryCollection`, `endImageCollection`) from `astro/app` that were added in Astro 7.2.0, so earlier versions fail at build time with a `MISSING_EXPORT` error.
