---
'astro': patch
---

Specify `data-astro-reload` (no value) on an anchor element to force the browser to ignore view transitions and fall back to default loading.

This is helpful when navigating to documents that have different content-types, e.g. application/pdf, where you want to use the build in viewer of the browser.
Example: `<a href='/my.pdf' data-astro-reload>...</a>`
