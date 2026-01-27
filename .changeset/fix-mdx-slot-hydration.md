---
'astro': patch
---

Fixes hydration for framework components inside MDX when using `Astro.slots.render()`

Previously, when multiple framework components with `client:*` directives were passed as named slots to an Astro component in MDX, only the first slot would hydrate correctly. Subsequent slots would render their HTML but fail to include the necessary hydration scripts.
