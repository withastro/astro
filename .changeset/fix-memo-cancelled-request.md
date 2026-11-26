---
'astro': patch
---

Fixes a bug on Cloudflare Workers where a request cancelled while Astro was still loading the middleware, session driver, actions, cache provider, or logger caused every later request to fail with "This promise was created by a request that has since ended"
