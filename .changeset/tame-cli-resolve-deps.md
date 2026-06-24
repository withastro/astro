---
'astro': patch
---

Fixes `astro check` (and other commands that auto-install dependencies) failing to find `typescript` and `@astrojs/check` when Astro is installed outside of the project directory (e.g. a pnpm global or virtual store). Dependencies are now resolved and imported from the project directory instead of from Astro's own location.
