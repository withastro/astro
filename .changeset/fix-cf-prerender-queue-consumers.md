---
'@astrojs/cloudflare': patch
---

Fixes `ERR_MULTIPLE_CONSUMERS` error when using Cloudflare Queues with prerendered pages. The prerender worker config callback now excludes `queues.consumers` from the entry worker config, since the prerender worker only renders static HTML and should not register as a queue consumer. Queue producers (bindings) are preserved.
