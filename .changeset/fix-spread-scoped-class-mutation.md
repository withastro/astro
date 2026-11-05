---
'astro': patch
---

Fixes spread attributes on elements with scoped styles mutating the spread object, which caused the `class` attribute to grow on every render when the object was reused across renders
