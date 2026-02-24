---
"astro": patch
---

Fixes a dev server error (`ReferenceError: __PREFETCH_PREFETCH_ALL__ is not defined`) when using `prefetch` with `<ClientRouter />`. The prefetch module is now excluded from Vite's dependency optimization so its placeholders are correctly replaced at dev time.
