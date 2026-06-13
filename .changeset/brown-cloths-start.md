---
'astro': patch
---

Fixes prerendered redirect targets being incorrectly bundled into the SSR function in hybrid mode, causing massive bundle size inflation
