---
'astro': patch
---

Fixes CSS Module HMR leaving server-rendered components with stale class names when the same module is also used by a hydrated island
