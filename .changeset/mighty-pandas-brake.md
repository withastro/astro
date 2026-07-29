---
'astro': patch
---

Fixes a bug where `<ClientRouter />` downloaded a page a second time even though prefetching had just downloaded it. The router now reuses (once per prefetch) the response of a recent prefetch instead of going back to the network for pages that are served without cache headers, such as on-demand rendered pages.
