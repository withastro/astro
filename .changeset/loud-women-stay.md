---
'astro': patch
---

Prevent double-prefixed redirect paths when using fallback and redirectToDefaultLocale together

Fixes an issue where i18n fallback routes would generate double-prefixed paths (e.g., `/es/es/test/item1/`) when `fallback` and `redirectToDefaultLocale` configurations were used together. The fix adds proper checks to prevent double prefixing in route generation.
