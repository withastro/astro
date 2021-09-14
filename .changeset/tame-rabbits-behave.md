---
'astro': patch
---

Improve stats logging to use `pretty-bytes` so that 20B doesn't get output as 0kB, which is accurate, but confusing
