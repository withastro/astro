---
'astro': patch
---

Refactors internals: the `.astro` compiler and the syntax-layer Vite plugins now live in `@astrojs/vite-plugin-astro`, and the render runtime in `@astrojs/runtime`, which `astro` depends on
