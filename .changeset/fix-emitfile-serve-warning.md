---
'astro': patch
---

Fixes the `emitFile() is not supported in serve mode` warning that appears during `astro dev` when using integrations that inject before-hydration scripts (e.g. `@astrojs/react`)
