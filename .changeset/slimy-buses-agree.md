---
'astro': patch
---

Fixes a bug in the parsing of  `x-forwarded-\*` `Request` headers, where multiple values assigned to those headers were not correctly parsed.

Now, headers like `x-forwarded-proto: https,http` are correctly parsed.
