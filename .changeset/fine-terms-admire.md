---
'astro': patch
---

Fixes CSS module scoped-name hash mismatch in `astro dev` when using `vite.css.transformer: 'lightningcss'` with content collections. Previously, a component importing a CSS module and rendered via content collection `render()` would get different class name hashes in the element and the injected `<style>` tag, causing styles not to apply.
