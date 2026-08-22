---
'astro': patch
---

Fixes a `TypeError` crash when a Content Collection schema applies Zod `.readonly()` (or otherwise freezes parsed data) on objects containing `image()` fields. The Content Layer now strips image reference prefixes immutably instead of mutating the parsed entry data in place.