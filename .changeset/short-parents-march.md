---
'astro': patch
---

Fixes `astro check` reporting that `@astrojs/check` is not installed when the package is installed but throws while loading. The original error is now shown instead.
