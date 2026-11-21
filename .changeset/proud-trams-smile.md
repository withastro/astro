---
'@astrojs/react-renderer': patch
---

Fixes whitespace and top-level text being dropped from children with `experimentalReactChildren`, which caused hydration mismatches in islands
