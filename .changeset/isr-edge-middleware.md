---
'@astrojs/vercel': patch
---

Fixes `middlewareMode: 'edge'` being ignored when `isr` is enabled

The middleware edge function was built and deployed, but every route was pointed at the ISR function instead, so nothing invoked it. Middleware only ran inside the ISR function — which ISR skips entirely on a cache hit — meaning middleware silently stopped running once an entry was warm.

Routes backed by ISR now go through the middleware edge function first, and `next()` forwards to the ISR function so cached responses are still served. Routes listed in `isr.exclude` continue to forward to the serverless function.
