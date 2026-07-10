---
'@astrojs/language-server': patch
---

Fixes `astro check` reporting unused variable hints (`ts(6133)`, `ts(6196)`, etc.) even when `noUnusedLocals` / `noUnusedParameters` are disabled in the project's tsconfig. When these options are enabled, unused declarations are still reported as errors, matching `tsc`'s behavior.
