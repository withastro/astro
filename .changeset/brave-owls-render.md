---
'@astrojs/cloudflare': minor
---

Uses Astro's built-in image pipeline to optimize images on prerendered pages, including with the Cloudflare Images binding. Requires `astro@^7.4.0`

Prerendered images on Cloudflare now behave the same as on other adapters. Images optimized with the Cloudflare Images binding are cached between builds, and image options such as `assetQueryParams` and `build.assetsPrefix` are applied the same way as everywhere else.
