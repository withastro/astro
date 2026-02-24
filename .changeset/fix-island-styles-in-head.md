---
'astro': patch
---

Moves `astro-island` styles (`display:contents`) from `<body>` to `<head>`

The `<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>` tag was previously rendered inline in the `<body>` alongside hydration scripts, causing HTML validation errors. It is now included in the `<head>` via `result.styles` when framework renderers are configured.
