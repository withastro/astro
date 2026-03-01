---
'create-astro': patch
---

Fixes a hang that could occur when the npm registry is slow or unresponsive by adding a 10 second timeout to the version check
