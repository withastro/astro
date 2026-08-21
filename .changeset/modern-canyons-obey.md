---
'astro': patch
---

Fixes `server:defer` crashing the dev server with "undefined is not a function" when a deferred component imports from `astro:i18n`
