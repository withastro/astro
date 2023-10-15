---
'create-astro': patch
---

Skip cleanup after template download failed if the path is `.`, `./` or starts with `../`.
