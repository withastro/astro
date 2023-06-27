---
'astro': patch
---

Fix the URL that belongs to `entryPoints` in the hook `astro:build:ssr`. The paths were created with the wrong output directory.
