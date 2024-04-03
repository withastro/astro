---
"astro": patch
---

Fixes a case where the `i18n` virtual module was transformed into a no-op function when some functions were used inside a non-prerendered page.
