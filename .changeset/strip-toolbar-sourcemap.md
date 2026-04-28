---
'astro': patch
---

Fixes a spurious 404 request for a dev toolbar sourcemap during `astro dev` caused by the browser mis-resolving a relative `sourceMappingURL` from the `/@id/` URL prefix
