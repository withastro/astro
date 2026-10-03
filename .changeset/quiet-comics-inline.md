---
'astro': patch
---

Fixes a runtime `ReferenceError` for inlined scripts that import a URL with `/* @vite-ignore */`.

A dynamic import annotated with `@vite-ignore` is not reported by Rolldown as a dynamic import, so a script chunk using one could be inlined into the HTML with Vite's `__VITE_PRELOAD__` helper still referenced. Astro now keeps such chunks external, the same way it already did for regular dynamic imports.
