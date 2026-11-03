---
'astro': patch
---

Fixes form actions rejecting fields whose validator chains `.optional()`, `.nullable()`, or `.default()` before `.transform()` or `.pipe()`, such as `z.number().optional().transform(fn)`. These fields are now converted to numbers, booleans, and arrays like the same validators without the transform, and a missing optional field is passed as `undefined` instead of `null`.
