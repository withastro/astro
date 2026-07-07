---
'astro': patch
---

Fixes a dev server crash when a `.html` or `/index.html` suffixed request (such as those `netlify dev` probes as pretty-URL fallbacks) matched a dynamic endpoint route, causing a `TypeError: Missing parameter` error
