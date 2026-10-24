---
'astro': patch
---

Fixes `<ClientRouter />` animating scroll restoration on back/forward navigation when `scroll-behavior: smooth` is set. Saved scroll positions are now restored instantly, matching the browser's native behavior.
