---
'@astrojs/language-server': patch
---

Fixes `astro check` silently skipping `.astro` files that are only reachable through a TypeScript project reference (a tsconfig referenced via `references` in another tsconfig). These files are now checked and reported like any other `.astro` file.
