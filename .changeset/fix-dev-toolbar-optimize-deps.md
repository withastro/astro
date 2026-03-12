---
'astro': patch
---

Prebundle `astro/toolbar` in dev when custom dev toolbar apps are registered, preventing re-optimization reloads that can hide or break the toolbar.
