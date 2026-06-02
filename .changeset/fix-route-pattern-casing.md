---
'astro': patch
---

Fixes `Astro.routePattern` to preserve original casing of dynamic parameter names from filenames. Previously, a file at `src/pages/blog/[postId].astro` would return `/blog/[postid]` for `Astro.routePattern` due to an internal `.toLowerCase()` call. It now correctly returns `/blog/[postId]`.
