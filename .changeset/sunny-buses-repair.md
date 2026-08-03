---
'astro': minor
---

Adds a `getStaticAsset` option to `app.render()`

Adapters can now pass a `getStaticAsset` callback to `app.render()`. When the new `"on-request"` middleware mode is active and a prerendered route is matched, Astro runs middleware at request time and then calls `getStaticAsset(route, pathname)` to serve the prerendered HTML from disk instead of re-rendering the page component.
