---
'astro': patch
---

Fixes a bug where the Windows `EPERM` fallback in `emptyDir` failed on Node.js 26 with `ERR_INVALID_ARG_VALUE`, because it removed directories with `rmdirSync` and the `recursive` option
