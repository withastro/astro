---
'astro': patch
---

Fixes `getCollection()` and `getEntry()` throwing `DataCloneError` when a content collection schema produces values that `structuredClone` cannot handle, such as `Temporal.PlainDate` or other class instances returned from a Zod `transform()`. Image reference replacement now clones only the plain objects and arrays it may modify, passing all other values through by reference.
