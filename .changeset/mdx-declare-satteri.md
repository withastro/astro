---
'@astrojs/mdx': patch
---

Adds `satteri` as a direct dependency of `@astrojs/mdx`. The Sätteri MDX entrypoints import `satteri`, but it was previously only available transitively via the optional `@astrojs/markdown-satteri` peer. Under pnpm's isolated `node_modules`, that could fail with `ERR_MODULE_NOT_FOUND` when looking up the bare `satteri` import.

