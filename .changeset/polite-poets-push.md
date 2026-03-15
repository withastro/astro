---
'astro': patch
---

Fixes an issue where the build incorrectly leaked server entrypoint into the client environment, causing adapters to emit warnings during the build.
