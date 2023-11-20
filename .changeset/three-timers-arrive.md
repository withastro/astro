---
'@astrojs/react': patch
---

Fixes an issue where slotting self-closing elements (img, br, hr) into react components with `experimentalReactChildren` enabled led to an error.
