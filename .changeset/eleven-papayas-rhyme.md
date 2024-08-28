---
'astro': patch
---

Fixes a case where Vite would be imported by the SSR runtime, causing bundling errors and bloat.
