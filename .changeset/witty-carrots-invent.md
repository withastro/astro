---
'astro': patch
---

Fixes `getCollection()` and `getEntry()` throwing `DataCloneError` when a collection schema transform returns a `Temporal.PlainDate` or other class instance.
