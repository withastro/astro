---
'astro': patch
---

Fixes missing `render()` type overload for live collection entries. Previously, calling `render()` on a `LiveDataEntry` produced a TypeScript error when using only `live.config.ts` without a `content.config.ts`.
