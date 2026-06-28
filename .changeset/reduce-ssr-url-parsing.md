---
'astro': patch
---

Reduces per-request URL parsing and allocations in the SSR request pipeline, collapsing up to three `request.url` parses per request down to one across the core render and match paths. This is an internal performance change with no behavior difference.

Note: `createRequestFromNodeRequest` (exported from `astro/app/node`) now returns `{ request, url }` instead of a bare `Request`. Astro's internal call sites are updated; external importers must destructure `.request`.
