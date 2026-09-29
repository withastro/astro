---
'@astrojs/cloudflare': minor
---

Updates prerendered image generation to Astro's new image tracking. Requires `astro@^7.4.0`.

Prerendering in workerd now honors an object `build.assetsPrefix` and the adapter's `assetQueryParams` for optimized images, and keeps original images whose `src` is read by a prerendered page. Some optimized image file names change once after upgrading, because they're now hashed with the configured image service.
