---
"@astrojs/language-server": patch
---

Fixes errors when using a tsconfig.json

Previously when using a tsconfig.json that had an `include` property, that property would cause diagnostics in astro files to show JSX related errors. This fixes that issue.