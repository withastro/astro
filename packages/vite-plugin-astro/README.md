# @astrojs/vite-plugin-astro

A Vite plugin for the Astro component language: it owns the shared project configuration (`root`, `srcDir`, `publicDir`, `site`, `compressHTML`, `trailingSlash`), framework renderers, and client directives, and exposes them to other plugins through `api.astro`. This package is at an early stage: it currently ships the plugin API, option schema, and render-layer types used by `astro`; see [API.md](./API.md) for the contract.
