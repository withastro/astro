---
'astro': patch
---

Fixed prefetch placeholder constants not being replaced when `<ClientRouter />` is used, which caused `ReferenceError: __PREFETCH_PREFETCH_ALL__ is not defined` in the browser console. The prefetch module is now excluded from Vite's dependency optimization to ensure the transform hook runs correctly.
