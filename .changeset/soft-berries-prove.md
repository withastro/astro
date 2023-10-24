---
'create-astro': patch
---

No longer attempts to delete the directory after a template download fails if the path is `.`, `./` or starts with `../`.
