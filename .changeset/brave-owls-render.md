---
'@astrojs/cloudflare': minor
---

Reworks image processing on prerendered pages to use Astro's built-in image pipeline. Requires `astro@^7.4.0`

Prerendered images on Cloudflare now behave the same as on other adapters. Images optimized with the Cloudflare Images binding are cached between builds, and image options such as `assetQueryParams` and `build.assetsPrefix` are applied the same way as everywhere else.
