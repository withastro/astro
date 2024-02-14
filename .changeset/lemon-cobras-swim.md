---
"astro": patch
---

Fixes edge case on i18n fallback routes

Previously index routes deeply nested in the default locale, like `/some/nested/index.astro` could be mistaked as the root index for the default locale, resulting in an incorrect redirect on `/`.

