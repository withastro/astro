---
'astro': patch
---

Fixes the background dev server failing to start when `astro` is hoisted outside the project's `node_modules` (for example bun workspaces). The background process is now spawned from Astro's own resolved location instead of a path assumed under the project root.
