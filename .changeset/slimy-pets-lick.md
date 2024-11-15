---
'astro': patch
---

Fixes an issue where scripts were not correctly injected during the build. The issue was triggered when there were injected routes with the same `entrypoint` and different `pattern`
