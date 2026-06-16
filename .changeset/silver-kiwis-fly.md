---
'vite-plugin-astro': minor
'@astrojs/internal-helpers': minor
---

Adds a new `vite-plugin-astro` package — a standalone Vite plugin for compiling `.astro` files, extracted from the `astro` package. This allows custom Vite setups and other tools to compile `.astro` files without depending on the full Astro runtime.

Also adds `@astrojs/internal-helpers/vite` and `@astrojs/internal-helpers/environments` submodules, consolidating shared Vite utilities and Astro environment helpers used across packages.
