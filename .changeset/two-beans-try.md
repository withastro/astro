---
'@astrojs/web-vitals': major
'astro': major
---

Removes the `prerender` option from `injectRoute` in the Integrations API.

The `injectRoute` integration method no longer accepts `prerender: true`. 

Instead,  add the `prerender` export to your injected route like you would for other routes defined in the `src/pages` directory:

```astro
---
export const prerender = true
---
```
