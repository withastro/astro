---
'astro': patch
---

Fixes a `TSCONFIG_ERROR` during `astro build` when a parent directory contains a `tsconfig.json` that cannot be resolved, such as one extending `astro/tsconfigs/strict` without installed dependencies
