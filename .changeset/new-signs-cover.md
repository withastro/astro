---
'astro': patch
---

Fixes the `astro` CLI refusing to run on StackBlitz by allowing Node.js `>=22.22.0` inside WebContainers, whose Node.js version users cannot change
