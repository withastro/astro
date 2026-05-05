---
'astro': patch
---

Fixes `z.array(z.boolean())` in form actions incorrectly coercing the string `"false"` to `true`. Boolean array elements now use the same `'true'`/`'false'` string comparison as single `z.boolean()` fields, so submitting `["false", "true", "false"]` correctly parses as `[false, true, false]`.
