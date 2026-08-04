---
'astro': patch
---

Loads the default Sätteri Markdown processor lazily so it is only resolved when Markdown is actually rendered. Previously it was imported at the top of the config schema and pulled into the module graph on every `astro dev`/`build`, which broke builds on platforms where Sätteri's optional native binary is not installed even when the project had no Markdown files.
