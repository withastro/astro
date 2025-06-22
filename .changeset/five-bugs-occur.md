---
'astro': patch
---

Fixes a case where `astro:config/client` and `astro:config/server` virtual modules would not contain config passed to integrations `updateConfig()` during the build
