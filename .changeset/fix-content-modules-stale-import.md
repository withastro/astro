---
'astro': patch
---

Fixes `content-modules.mjs` not removing entries for deleted or renamed content files, which could cause Vite to attempt to resolve non-existent modules
