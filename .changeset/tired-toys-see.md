---
'astro': patch
---

Fixes Sass/SCSS `@use` and `@import` resolution against tsconfig `baseUrl`. Bare specifiers now correctly resolve extensionless imports (e.g. `@use "colors"`) and underscore-prefixed partials (e.g. `@use "partials"` for `_partials.scss`) when `baseUrl` is set in `tsconfig.json`.
