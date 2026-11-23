---
'astro': patch
---

Fixes the `file()` loader silently producing an empty collection when its data file cannot be parsed. `astro build` now fails with the parser's error message, and in `astro dev` a broken edit logs the error and keeps the previously loaded entries.
