---
'astro': patch
---

Fixes server bundles including every renderable content collection entry when no server-rendered route calls `render()` from `astro:content`. Since 7.3.0, entries rendered only by prerendered pages were compiled into the server output, which could push functions past platform size limits (for example, Vercel's 250 MB).
