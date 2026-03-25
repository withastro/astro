---
'astro': patch
---

Fixes `experimental.queuedRendering` incorrectly escaping the HTML output of `.html` page files, causing the page content to render as plain text instead of HTML in the browser.
