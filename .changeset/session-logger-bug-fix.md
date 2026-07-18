---
'astro': patch
---

Routes session runtime diagnostics through `AstroLogger` to respect user configuration, and properly resets the internal session partial state after recovery from storage regeneration failures to avoid unnecessary storage access.
