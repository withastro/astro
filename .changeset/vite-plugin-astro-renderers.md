---
'@astrojs/vite-plugin-astro': minor
'@astrojs/runtime': minor
---

Adds declarative renderer fields: an `AstroRenderer` can carry `options` (passed to its server entrypoint as `this.options`), `optimizeDeps`, `dedupe`, `noExternal` (a list, or a function of the project root for lists found by crawling dependencies), a dev-only `devHeadScript` and an `appEntrypoint` that its entrypoints import, which `astro()` applies, so a renderer is plain data next to the framework's own Vite plugin
