---
'astro': patch
---

Fixes prerender errors being silently swallowed when using a custom `src/fetch.ts` with an adapter that prerenders in its own runtime, such as `@astrojs/cloudflare`. Previously, a page that threw during prerendering was written as an empty HTML file and the build succeeded. The build now fails with the underlying error.
