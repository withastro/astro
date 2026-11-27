---
'@astrojs/runtime': patch
---

Fixes a `process is not defined` error when you use `createRenderer()` in the browser to render a compiled Astro component that contains a framework island
