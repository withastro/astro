---
'astro': patch
---

Fixes an issue where the index route would return a 404 error when using a custom `base` path combined with `trailingSlash: 'never'`. This ensures that the home page and internal rewrites are correctly matched under these configurations.
