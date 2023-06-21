---
'astro': patch
---

Fix `astro:build:setup` hook `updateConfig` utility, where the configuration wasn't correctly updated when the hook was fired.
