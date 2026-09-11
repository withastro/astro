---
'astro': patch
---

Fixes the dev server incorrectly stripping `base` from unrelated URLs when the base is a non-segment prefix (e.g. `base: '/s'` breaking `/src/...` requests)
