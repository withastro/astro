---
'astro': patch
'@astrojs/node': patch
---

Fixes an EventEmitter memory leak when serving static pages from Node.js middleware.

When using the middleware handler, requests that were being passed on to Express / Fastify (e.g. static files / pre-rendered pages / etc.) weren't cleaning up socket listeners before calling `next()`, causing a memory leak warning. This fix makes sure to run the cleanup before calling `next()`.
