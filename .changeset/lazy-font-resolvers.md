---
'astro': patch
---

Avoids loading the font resolution dependencies (`unifont` and `@capsizecss/unpack`) when the `fonts` option isn't configured, which speeds up loading `astro/config` and running Astro commands
