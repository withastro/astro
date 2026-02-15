---
'astro': patch
'@astrojs/cloudflare': patch
'@astrojs/netlify': patch
'@astrojs/node': patch
'@astrojs/vercel': patch
---

Create new `middlewareMode` adapter feature and deprecate `edgeMiddleware` option

There are no user-facing changes in this update, but it lays the groundwork for future improvements to middleware handling in Astro. The `edgeMiddleware` option is now deprecated and will be removed in a future release, so users should transition to using the new `middlewareMode` feature as soon as possible.
