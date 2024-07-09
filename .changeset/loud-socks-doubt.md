---
'astro': patch
---

Fixes a case where Astro's config `experimental.env.schema` keys did not allow numbers. Numbers are still not allowed as the first character to be able to generate valid JavaScript identifiers
