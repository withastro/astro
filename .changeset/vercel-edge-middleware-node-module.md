---
'@astrojs/vercel': patch
---

Fixes edge middleware builds failing with "Vercel does not allow the use of Node.js built-ins in edge functions: node:module" when a server dependency such as `sharp` calls `require()` but the middleware itself never does
