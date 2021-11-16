---
'astro': patch
---

Fixes routing regression in next.4. Subpath support was inadvertedly prevent any non-index routes from working when not using a subpath.