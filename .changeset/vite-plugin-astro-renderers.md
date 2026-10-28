---
'@astrojs/vite-plugin-astro': minor
'@astrojs/runtime': minor
---

Adds declarative renderer fields: an `AstroRenderer` can carry `options` (passed to its server entrypoint as `this.options`), `optimizeDeps`, `dedupe`, `noExternal` and a dev-only `devHeadScript`, which `astro()` applies, so a renderer is plain data next to the framework's own Vite plugin
