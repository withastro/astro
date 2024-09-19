---
'astro': patch
---

Fixes a bug where the rewrite via `next(/*..*/)` inside a middleware didn't compute the new `APIContext.params`
