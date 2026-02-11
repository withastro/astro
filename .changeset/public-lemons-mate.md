---
'create-astro': patch
---

Fixes an issue where `--add` could accept any kind of string, leading to different errors. Now `--add` accepts only values of valid integrations and adapters.
