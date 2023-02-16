---
'astro': patch
---

Do not transform `--camelCase` custom properties to `--camel-case` when they're in a `style` attribute. 

This bug fix is backwards-compatible because we will emit both `--camelCase` and `--camel-case` temporarily. This behavior will be removed in a future version of Astro.
