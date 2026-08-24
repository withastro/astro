---
'astro': patch
---

Although 'extractStringFromFunction' already returns a formatted string, an extra 'String.raw' wrapper was applied. This change removes the redundant wrapper and directly returns it.
