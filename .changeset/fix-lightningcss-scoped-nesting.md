---
'astro': patch
---

Fixes scoped styles applying to the wrong element when `vite.css.transformer` is set to `'lightningcss'` and a selector uses a nested `&` inside `:where(...)`, such as Tailwind v4's `space-x-*`, `space-y-*`, and `divide-*` utilities.
