---
'@astrojs/deno': major
'@astrojs/netlify': major
'@astrojs/image': major
'astro': major
---

**Breaking Change**: client assets are built to an `_astro` directory rather than the previous `assets` directory. This setting can now be controlled by the new `build` configuration option named `assets`.

This should simplify configuring immutable caching with your adapter provider as all files are now in the same `_astro` directory.
