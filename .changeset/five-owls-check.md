---
'astro': patch
---

Fixes a case where rewriting `/` would cause an issue, when `trailingSlash` was set to `"never"`.
