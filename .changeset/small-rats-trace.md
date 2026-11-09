---
'@astrojs/netlify': patch
'@astrojs/vercel': patch
---

Prevents server function traces from including the entire project when a dependency uses paths the tracer cannot resolve.
