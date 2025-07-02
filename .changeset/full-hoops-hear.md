---
'@astrojs/netlify': patch
'@astrojs/vercel': patch
---

Fixes the internal implementation of the new feature `experimentalStaticHeaders`, where dynamic routes
were mapped to use always the same header. 
