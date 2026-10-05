---
'astro': patch
---

Fixes CSS from other pages leaking into a page's `<head>` in dev when the page imports a module such as `astro:config/server`.
