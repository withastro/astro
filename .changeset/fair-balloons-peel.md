---
'astro': patch
---

Fixes a bug where Astro Actions didn't properly support nested object properties, causing problems when users used zod functions such as `superRefine` or `discriminatedUnion`.
