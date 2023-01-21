---
'@astrojs/deno': major
'@astrojs/netlify': major
'@astrojs/image': minor
'astro': major
---

**Breaking Change**: client assets are built to an `_astro` directory in the build output directory. Previously these were built to various locations, including `assets/`, `chunks/` and the root of build output.

You can control this location with the new `build` configuration option named `assets`.
