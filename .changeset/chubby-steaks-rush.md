---
'astro': patch
---

Fixes a dev server bug where changing a collection schema in `src/content.config.ts` together with one of its data files could store entries parsed with the old schema until the data store was deleted
