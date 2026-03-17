---
'astro': patch
---

Fix skew protection query params not being applied to island hydration `component-url` and `renderer-url`, and ensure query params are appended safely for asset URLs with existing search/hash parts.
