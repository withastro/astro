---
'astro': patch
---

Fixes `fontProviders.googleicons()` returning the full icon font (~3.9MB) instead of only the requested glyphs when multiple `experimental.glyphs` are specified
