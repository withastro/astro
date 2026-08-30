---
'astro': patch
---

Fixes prerender conflict warnings to correctly identify the route that first rendered a duplicate pathname, instead of misattributing the conflict to an unrelated route that merely matches the URL pattern
