---
'@astrojs/vercel': patch
---

Fixes `middlewareMode: 'edge'` not running your middleware when `isr` is also enabled

Previously, enabling both options deployed the edge middleware but never reached it: requests went straight to the ISR function, which skips rendering entirely on a cache hit. Middleware now runs at the edge for ISR-backed routes before the cached response is served, and query strings are preserved when it forwards the request.
