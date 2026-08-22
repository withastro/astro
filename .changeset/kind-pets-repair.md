---
'astro': patch
---

Fixes content collection image processing failing with `TypeError` when a Zod schema uses `.readonly()` on an object containing `image()` fields
