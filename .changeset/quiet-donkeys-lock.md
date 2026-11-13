---
'astro': patch
---

Fixes the `background` field in `.astro/dev.json` and `.astro/preview.json` so that `ASTRO_DEV_BACKGROUND=0` / `ASTRO_PREVIEW_BACKGROUND=0` record `"background": false`, as documented
