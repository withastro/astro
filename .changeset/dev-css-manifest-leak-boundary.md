---
'astro': patch
---

Fixes CSS from unrelated pages leaking into a route's `<head>` in `astro dev` when that route (or something it imports, e.g. `astro:config/server`) reaches the routing manifest. The dev CSS graph walk now stops at `virtual:astro:pages`, mirroring the boundary already enforced for the production build's CSS graph walk.
