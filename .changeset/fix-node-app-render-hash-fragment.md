---
'@astrojs/node': patch
'astro': patch
---

Fixes an issue where URLs containing hash fragments caused server crashes when using the Node.js adapter

Some HTTP tools (like `wrk`) can send requests with `#` in the URL, which is technically invalid since hash fragments should only be handled client-side. This change:

1. Strips hash fragments from incoming URLs in the static handler before processing
2. Adds defensive validation in `App.render()` to provide a descriptive error message when `mod.page` is not a function

Fixes #14625
