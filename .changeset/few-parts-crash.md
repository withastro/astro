---
'astro': minor
'@astrojs/node': minor
---

Adds new middleware mode "on-request".

By default (`"classic"` mode), middleware runs on request for dynamic pages, and during build for static pages. You can now choose `"on-request"` to run middleware when a page is requested on the server, regardless of whether it was prerendered.