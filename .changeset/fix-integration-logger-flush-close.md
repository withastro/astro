---
'astro': patch
---

Fixes a bug where SSR responses in `astro dev` could crash with `TypeError: this.logger.flush is not a function`.
