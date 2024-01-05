---
'astro': patch
---

Improves tailwind config file detection when adding the tailwind integration using `astro add tailwind`

Tailwind config file ending in `.ts`, `.mts` or `.cts` will now be used instead of creating a new `tailwind.config.mjs` when the tailwind integration is added using `astro add tailwind`.
