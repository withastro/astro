---
'astro': patch
---

Fixes style resolution in dev mode on case-insensitive file systems (macOS, Windows) where path casing differences between the working directory and the actual filesystem caused styles not to be found.
