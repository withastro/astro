---
'astro': patch
---

Fixes spreading an object onto an element with scoped styles changing that object. When the same object was spread on every render, for example a constant imported from another module, its `class` grew with every request.
