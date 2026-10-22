---
'astro': patch
---

Fixes `astro build` deleting a `.git` directory at the root of `outDir`. The build was meant to keep it, but didn't.
