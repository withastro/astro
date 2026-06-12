---
'astro': patch
---

Fixes CSS from `client:only` islands leaking to unrelated pages when Rollup bundles non-CSS-importing modules into the same chunk as CSS-importing modules
