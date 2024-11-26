---
'create-astro': patch
---

Fixes an issue where the `getVersion` function was incorrectly using the `latest` tag instead of the user-specified `ref` to determine the Astro version.
