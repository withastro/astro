---
'astro': patch
---

Fixes a race condition in the content layer data store where multiple calls to `store.set()` with a synchronous interval between them could cause internal concurrent calls to `writeToDisk` and result in dropped content collection entries.
