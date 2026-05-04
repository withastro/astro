---
'astro': patch
---

Fixes `data-astro-prefetch="tap"` not triggering when clicking nested elements (e.g. `<span>`, `<img>`, `<svg>`) inside an anchor tag.
