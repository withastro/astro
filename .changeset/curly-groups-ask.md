---
'astro': patch
---

Fixes a bug where the Astro compiler wasn't freed at the end of the build. After the fix, the memory used by the compiler is now correctly freed at the end of the build.
