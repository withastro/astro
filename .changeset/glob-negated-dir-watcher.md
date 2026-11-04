---
'astro': patch
---

Fixes the `glob()` loader adding files from a folder excluded with a negation pattern such as `!_docs` when they change during `astro dev`
