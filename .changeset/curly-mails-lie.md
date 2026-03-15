---
'astro': patch
---

Fix dev routing for `server:defer` islands when adapters opt into handling prerendered routes in Astro core. Server island requests are now treated as prerender-handler eligible so prerendered pages using `prerenderEnvironment: 'node'` can load island content without `400` errors.
