---
"astro": patch
---

fix(prefetch): exclude prefetch module from Vite dep optimization

Adds a `config()` hook to the `astroPrefetch` Vite plugin that excludes `astro/virtual-modules/prefetch.js` from Vite's dependency optimization. This prevents esbuild from pre-bundling the module (which skips Vite plugin `transform` hooks), ensuring placeholder constants are correctly replaced at dev time.

Fixes #15520
