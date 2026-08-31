---
'astro': patch
---

Fixes a `TypeError: Cannot assign to read only property` thrown by the Content Layer when a collection Zod schema uses `.readonly()` on an object containing an `image()` field. The parsed data is now cloned before image references are processed, so frozen objects returned by `.readonly()` schemas are no longer mutated in place.
