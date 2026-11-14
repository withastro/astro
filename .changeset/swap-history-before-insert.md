---
'astro': patch
'@astrojs/runtime': patch
---

Fixes `<ClientRouter />` navigations so that custom elements connected while the new page is inserted see the new page's URL and history entry, and a `history.replaceState()` call from them no longer overwrites the previous page's history entry
