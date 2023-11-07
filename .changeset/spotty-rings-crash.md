---
'@astrojs/lit': patch
---

Fix hydration ordering of nested custom elements. Child components will now wait for their parents to hydrate before hydrating themselves.
