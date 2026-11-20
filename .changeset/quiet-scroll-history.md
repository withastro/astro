---
'astro': patch
---

Fixes `<ClientRouter />` writing to the browser history on every scroll. A script-driven scroll that called `scrollTo()` once per frame could exceed Safari's limit on history writes, after which internal links stopped working for 10 seconds. Scroll positions are now recorded only when leaving a page, and still restored on back/forward navigation and reload
