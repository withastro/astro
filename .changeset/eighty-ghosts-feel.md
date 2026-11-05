---
'astro': patch
---

Fixes `astro check` exiting with code 0 when `@astrojs/check` or `typescript` is not installed. The command now exits with code 1 so CI fails instead of silently skipping type checking.
