---
'astro': patch
---

Fixes a bug where the dev server was not providing a consistent user experience for configured redirects.

With the fix, when you configure a redirect in `astro.config.mjs` like this `{ /old: "/new" }`, the dev server return an HTML response that matches the one emitted by a static build. 
