---
'@astrojs/node': patch
---

Fixes an EventEmitter memory leak when serving static pages over keep-alive connections with `staticHeaders` enabled and CSP (`security.csp`) active
