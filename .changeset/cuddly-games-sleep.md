---
'astro': patch
---

Refactors path alias resolution to use Vite's native `tsconfigPaths` option

This is an internal change with no expected impact on user projects. Astro now defers tsconfig and jsconfig `paths` alias resolution to Vite, keeping a small fallback for a few CSS cases Vite does not yet handle.
