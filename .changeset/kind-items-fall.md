---
'astro': patch
---

Fixes `astro check` failing to find `@astrojs/check` and `typescript` when astro is installed in a directory outside the project tree (e.g. pnpm virtual store)
