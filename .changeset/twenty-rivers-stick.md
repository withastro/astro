---
'astro': patch
---

Fixes CSP hashes added with `Astro.csp` from components rendered inside `<body>` being left out of the CSP `<meta>` element in static builds
