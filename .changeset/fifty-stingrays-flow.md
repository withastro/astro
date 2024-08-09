---
'astro': patch
'@astrojs/db': patch
---

Refactors internally to use `node:util` `parseArgs` instead of `yargs-parser`
