---
'astro': patch
---

Fixes a bug where Astro's i18n fallback system with `fallbackType: 'rewrite'` would not generate fallback files for pages whose filename started with a locale key.
