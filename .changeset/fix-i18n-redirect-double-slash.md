---
'astro': patch
---

Fixes `redirectToDefaultLocale` producing a protocol-relative URL (`//locale`) instead of an absolute path (`/locale`) when `base` is `'/'`.
