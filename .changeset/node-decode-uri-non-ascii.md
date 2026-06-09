---
"@astrojs/node": patch
---

Fix prerendered routes with non-ASCII slugs incorrectly redirecting to the trailing-slash variant in standalone mode when `trailingSlash` is set to `"never"`.
