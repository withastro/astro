---
'astro': patch
---

Added more verbose errors for content collections with invalid IDs.

Previously, when an entry in a content collection had an ID that wasn't a string, the error would omit the ID entirely. With this change, the error will now explicitly say that the ID has to be a string.
