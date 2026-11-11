---
'astro': patch
---

Fixes `astro check` reporting `@astrojs/check` as missing when the package is installed but throws while loading. The original error is now shown instead of an install prompt.
