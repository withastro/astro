---
'astro': patch
---

Fixes `glob()` loader swallowing rendering errors during content sync, which allowed `astro build` to exit successfully (code 0) even when a remark/rehype plugin threw an error
