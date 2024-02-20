---
"astro": patch
---

Fixes an issue where the `i18n.routing` object had all its fields defined as mandatory. Now they all are optionals and shouldn't break when using `astro.config.mts`.
