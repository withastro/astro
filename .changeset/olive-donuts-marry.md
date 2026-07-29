---
'astro': patch
---

Fixes `astro dev --background` and `astro preview --background` silently dropping the `--mode`, `--site`, `--base`, `--outDir`, `--verbose`, and `--silent` flags when spawning the server process
