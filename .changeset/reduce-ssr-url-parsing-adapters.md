---
'@astrojs/node': patch
'@astrojs/cloudflare': patch
'@astrojs/netlify': patch
'@astrojs/vercel': patch
---

Reduces per-request URL parsing in the SSR path by parsing `request.url` once and sharing it across `app.match()` and `app.render()` (previously parsed two to three times per request). This is an internal performance change with no behavior difference.
