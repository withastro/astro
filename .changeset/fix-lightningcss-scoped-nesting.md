---
'astro': patch
---

Fixes [#16524](https://github.com/withastro/astro/issues/16524). When `vite.css.transformer` is set to `'lightningcss'`, scoped styles using a nested `&` selector inside `:where(...)` (e.g. Tailwind v4's `space-x-*`, `space-y-*`, `divide-*` utilities) silently produced CSS where the scope attribute bound to the matched child instead of the intended parent. Astro now asks lightningcss to skip its `Nesting` lowering pass for the per-component preprocess call so the compiler's scope injector still sees the parent compound; Vite's downstream pipeline continues to lower nesting for the final bundle.
