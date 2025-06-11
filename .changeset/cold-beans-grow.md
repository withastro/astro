---
'astro': patch
---

Changes to the behavior of the CSP solution. Now Astro CSP hashes are served differntely:
- Via the `<meta>` element for static pages
- Via the `Response` header `content-security-policy` for dynamic pages
