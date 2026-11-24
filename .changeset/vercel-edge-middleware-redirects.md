---
'@astrojs/vercel': patch
---

Fixes edge middleware (`middlewareMode: 'edge'`) following redirects returned by pages and endpoints instead of sending them to the client
