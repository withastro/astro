---
'astro': patch
---

Fix CSS traversal boundaries so pages with `export const partial = true` still contribute styles when imported as components by other pages.
