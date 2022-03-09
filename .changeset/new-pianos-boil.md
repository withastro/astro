---
'astro': minor
---

## Updated `<head>` and `<body>` behavior

Since `astro@0.21`, Astro placed certain restrictions on what files could use `<head>` or `<body>` tags. In `astro@0.24`, the restrictions have been lifted. Astro will be able to correctly handle `<head>` and `<body>` tags in _any_ component, not just those in `src/pages/` or `src/layouts/`.
