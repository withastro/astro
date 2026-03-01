---
'astro': patch
---

Fixes an issue where API routes would overwrite public files during build. Public files now correctly take priority over generated routes in both dev and build modes.
