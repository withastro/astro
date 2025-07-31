---
'astro': patch
---

Fixes an issue where static redirects couldn't correctly generate a redirect when the destination is a prerendered route, and the `output` is set to `"server"`.
