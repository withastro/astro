---
'astro': patch
---

Fixes the static preview server to respect `preserveBuildClientDir`, serving files from `build.client` instead of `outDir` when the adapter requires it
