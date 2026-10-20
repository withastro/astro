---
'astro': patch
---

Fixes a dev server error (`Could not find server component name`) for a `server:defer` island that imports `astro:actions` or `astro:config/server`, when its page was not the first island page loaded after starting the server
