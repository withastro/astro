---
'@astrojs/mdx': patch
---

Adds `satteri` as a declared runtime dependency so pnpm's strict isolated `node_modules` can always resolve the bare `from 'satteri'` imports in the Sätteri MDX pipeline.

Previously, `satteri` was only listed as a `devDependency`, which meant the package resolved accidentally through hoisting but failed with `ERR_MODULE_NOT_FOUND` in strict pnpm setups (e.g. Vercel monorepo deploys).
