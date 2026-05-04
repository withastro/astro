---
'astro': patch
---

Fixes an issue where `i18n.fallback` pages with `fallbackType: 'rewrite'` were emitted with empty bodies during `astro build`.
