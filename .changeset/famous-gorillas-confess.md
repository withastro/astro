---
'astro': patch
---

Fixes an issue where `Astro.locals` coming from an adapter weren't available in the `404.astro`, when using the `astro dev` command,
