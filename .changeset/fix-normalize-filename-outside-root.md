---
'@astrojs/vite-plugin-astro': patch
---

Fixes `No cached compile metadata found` errors for `.astro` components with styles located outside the project root in a directory that shares no parent with it, such as dependencies in pnpm's global virtual store or a `node_modules` symlinked from another mount
