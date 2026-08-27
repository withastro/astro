---
'astro': patch
---

Fixes SSR manifest containing stale `entryModules` references to prerender-only chunks that no longer exist in the final build output
