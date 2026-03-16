---
'astro': patch
---

Fixes a build regression where SSR framework renderers could be removed when all project pages are prerendered, causing `server:defer` server islands to fail at runtime.
