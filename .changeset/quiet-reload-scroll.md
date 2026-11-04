---
'astro': patch
---

Fixes pages using `<ClientRouter />` briefly showing the top of the page on reload before jumping back to the previous scroll position. Full reloads now use the browser's native scroll restoration.
