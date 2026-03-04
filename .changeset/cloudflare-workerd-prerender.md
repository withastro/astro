---
'@astrojs/cloudflare': minor
---

Adds support for prerendering pages using the workerd runtime.

The Cloudflare adapter now uses the new `setPrerenderer()` API to prerender pages via HTTP requests to a local preview server running workerd, instead of using Node.js. This ensures prerendered pages are built using the same runtime that serves them in production.
