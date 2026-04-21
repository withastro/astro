---
'astro': patch
---

Fixes Sass/SCSS `@use` and `@import` not resolving bare specifiers against `baseUrl` in `tsconfig.json`. Projects using `@use "colors.scss"` with `"baseUrl": "src"` now resolve correctly.
