---
'astro': patch
---

Fixes a build crash when an `i18n.fallback` value is a locale whose `path` is not one of its `codes`.
