---
'astro': minor
---

Improves SSR performance for synchronous components by avoiding the use of Promises. With this change, SSR rendering of on-demand pages can be up to 4x faster.
