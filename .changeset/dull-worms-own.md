---
'astro': patch
---

Fixes a bug where [data URL images](https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data) were not correctly handled. The bug resulted in an `ENAMETOOLONG` error.
