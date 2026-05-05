---
'astro': patch
---

Fixes `Astro.preferredLocale` returning the wrong value when `i18n.locales` mixes object-form entries (`{ path, codes }`) with string entries that normalize to the same locale. The first matching code in the configured `locales` order is now selected, matching the documented behavior.
