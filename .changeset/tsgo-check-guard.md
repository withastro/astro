---
"@astrojs/language-server": patch
---

Fixes an opaque `Cannot read properties of undefined (reading 'fileExists')` crash when `astro check` runs against the TypeScript 7 native compiler. The native compiler does not ship the programmatic API the checker relies on yet, so `astro check` now fails early with a clear message pointing to the tracking issue instead.
