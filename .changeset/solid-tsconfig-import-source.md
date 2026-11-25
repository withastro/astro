---
'astro': patch
---

Updates the Solid tsconfig preset for Solid 2.0: `astro add solid-js` now writes `jsxImportSource: "@solidjs/web"` (renderer packages own their JSX namespaces and `jsx-runtime` type entries in 2.0; `solid-js` no longer exports one)
