---
'astro': patch
'@astrojs/runtime': patch
---

Fixes an unclear `Cannot find package 'esbuild'` build failure when `vite.build.cssMinify` or `vite.build.minify` is set to `'esbuild'`. Astro now reports that `esbuild` must be installed in your project to use these options.
