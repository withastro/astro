---
"astro": patch
---

Fixes a minor regression from 4.3.x when the vite.build.assetsInlineLimit configuration option was set to a string. Astro now automatically casts this to a number to match the Vite behaviour.
