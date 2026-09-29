---
'astro': patch
---

Fixes `astro build` failing on Windows with Node.js 25+ with `ERR_INVALID_ARG_VALUE` when clearing the output directory hits a transient `EPERM` error
