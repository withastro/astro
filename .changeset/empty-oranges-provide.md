---
'astro': patch
---

Fixes regression in build caused by use of URL module

Using this module breaks the build because Vite tries to shim it, incorrectly.
