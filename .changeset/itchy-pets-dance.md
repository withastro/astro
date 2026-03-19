---
'astro': patch
---

Fixes `Astro.rewrite()` failing when the target path contains duplicate slashes (e.g. `//about`). The duplicate slashes are now collapsed before URL parsing, preventing them from being interpreted as a protocol-relative URL.
