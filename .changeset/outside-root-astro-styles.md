---
'@astrojs/vite-plugin-astro': patch
---

Fixes a `No cached compile metadata found` error when building a project that imports an `.astro` component with styles from a directory sharing no parent with the project root, such as a pnpm global virtual store or a `node_modules` mounted from another volume.
