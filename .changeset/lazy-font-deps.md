---
'astro': patch
---

Improves startup time of every `astro` command for projects that don't configure `fonts`, by loading the font resolution dependencies only when fonts are used
