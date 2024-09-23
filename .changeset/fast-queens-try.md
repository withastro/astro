---
'astro': patch
---

Fixes a problem in the Container API, where a polyfill wasn't correctly applied. This caused an issue in some environments where `crypto` isn't supported.
