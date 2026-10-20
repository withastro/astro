---
'astro': patch
---

Fixes `astro sync`, `astro check` and `astro build` replacing the optimized dependencies of a dev server running in the same project, which broke framework islands in that dev server until it was restarted with `--force`
