---
'@astrojs/language-server': patch
---

Fixes `astro check` checking `.astro` files inside nested `node_modules` directories when no `tsconfig.json` or `jsconfig.json` is found. Only the `node_modules` directory at the root of the project was excluded.
