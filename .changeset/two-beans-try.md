---
'@astrojs/web-vitals': major
'astro': major
---

Remove the prerender option from injectRoute

The `injectRoute` integration method no longer accepts `prerender: true`. Instead the route's entrypoint needs to contain `export const prerender = true`, the same as non-injected routes.
