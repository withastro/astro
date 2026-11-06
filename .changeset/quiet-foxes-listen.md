---
'astro': patch
---

Fixes `astro dev status` and `astro dev logs` (and their `astro preview` equivalents) treating a server as backgrounded when it was started with the documented `ASTRO_DEV_BACKGROUND=0` or `ASTRO_PREVIEW_BACKGROUND=0` opt-out. The lock file now records these servers as running in the foreground.
