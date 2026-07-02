---
'astro': patch
---

Fixes route generation throwing "Missing parameter" (or silently dropping the segment) when a dynamic param's value is `0`. The generator used truthy checks instead of checking for `undefined`, so `paginate(posts, { params: { categoryId: 0 } })` would crash even though `0` is a perfectly valid param value.
