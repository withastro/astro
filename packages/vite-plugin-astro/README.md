# @astrojs/vite-plugin-astro

A Vite plugin for the Astro component language: it owns the shared project configuration (`root`, `srcDir`, `publicDir`, `site`, `compressHTML`, `trailingSlash`), framework renderers, and client directives, and exposes them to other plugins through `api.astro`. This package is at an early stage: it currently ships the plugin API, option schema, and render-layer types used by `astro`.

## `_internal/`

`@astrojs/vite-plugin-astro/_internal/*` exposes the modules under `src/internal/` (built to `dist/internal/`) to the other packages of the Astro monorepo. It is not public API: it has no stability guarantees and may change in any release.
