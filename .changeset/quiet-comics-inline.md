---
'astro': patch
---

Fixes a runtime `ReferenceError` for inlined scripts that import a URL with `/* @vite-ignore */`.

Astro now inlines scripts after Vite replaces its preload markers, so ignored dynamic imports can remain inline without shipping an unresolved `__VITE_PRELOAD__` reference.
