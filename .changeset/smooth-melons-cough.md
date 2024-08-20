---
'@astrojs/vercel': patch
---

Prevent race condition with Node 18

Using Node 18 there can be a race condition where polyfill for the `crypto` global is not applied in time. This change ensures the polyfills run first.
