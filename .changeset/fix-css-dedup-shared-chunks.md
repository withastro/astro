---
'astro': patch
---

Fixes duplicate CSS being emitted when a CSS module is shared between a hydrated (`client:load`) component and a client-only (`client:only`) component. Previously, the shared CSS chunk produced by the client build was kept even when all its CSS had already been emitted by the prerender build, resulting in the same styles being linked twice on the page.
