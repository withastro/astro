---
'@astrojs/cloudflare': patch
---

Removes warning when using the adapter with a static build. 

The Cloudflare adapter now has several uses outside of on-demand rendered pages, so this warning is misleading. Similar warnings have already been removed from other adapters.
