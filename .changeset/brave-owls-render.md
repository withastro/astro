---
'@astrojs/cloudflare': minor
---

Fixes several image issues in prerendered pages, including `assetQueryParams` and per-file-type `build.assetsPrefix` being ignored. Images optimized with the Cloudflare Images binding are now cached between builds. Some optimized image filenames will change once after upgrading. Requires `astro@^7.4.0`
