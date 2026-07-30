---
'@astrojs/react': patch
---

Fixes a crash in `check()` when a non-React object component (e.g., a Svelte component) is passed to the React renderer. The renderer now returns `false` instead of throwing a `TypeError` when `$$typeof` is missing.
