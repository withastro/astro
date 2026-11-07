---
'astro': patch
---

Fixes `fontProviders.npm({ remote: false })` failing with `CannotFetchFontFile` by reading font files from the installed package on disk
