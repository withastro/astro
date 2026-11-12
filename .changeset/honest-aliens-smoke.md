---
'astro': patch
---

Fixes `astro dev status`, `astro dev logs`, and the `astro preview` equivalents treating a server started with `ASTRO_DEV_BACKGROUND=0` or `ASTRO_PREVIEW_BACKGROUND=0` as a background server
