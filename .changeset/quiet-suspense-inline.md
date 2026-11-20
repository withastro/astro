---
'@astrojs/react-renderer': patch
---

Fixes React 19 `<Suspense>` content being hidden behind its fallback under `security.csp` or without JavaScript, by rendering suspended and large boundaries in place instead of revealing them with inline scripts
