---
'astro': patch
---

Improves the warning when accessing `Astro.session` without session storage configured. The `session` property is now always defined on the context object, and accessing it without configuration logs a helpful message instead of silently returning `undefined`.
