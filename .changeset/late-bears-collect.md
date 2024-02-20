---
"astro": patch
---

Improves runtime type-checking with the vite.build.assetsInlineLimit configuration option, which could result in errors when passing invalid options like strings. Astro now automatically casts this to a number to match the Vite behaviour.
