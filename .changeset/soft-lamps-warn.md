---
'create-astro': patch
---

Avoid spawning package manager commands with `shell: true` to prevent Node.js DEP0190 warnings during `create-astro` runs on newer Node versions.
