---
'astro': patch
---

Fixes preview for static sites that contain non-prerendered routes. Previously, the preview command ignored SSR routes discovered during route scanning and always used the static preview server.
