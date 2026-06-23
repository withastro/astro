---
'astro': patch
---

Fixes `astro dev --background --host` not listing the network addresses. The background server start output and `astro dev status` now show every exposed network URL, matching the foreground dev server.
