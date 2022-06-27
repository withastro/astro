---
'@astrojs/prefetch': patch
---

Adds a new `@astrojs/prefetch` integration with the goal of adding near-instant page navigation for Astro projects. HTML and CSS for visible links marked with `rel="prefetch"` will be preloaded in the browser when the browser is idle.

__astro.config.mjs__
```js
import prefetch from '@astrojs/prefetch';
export default {
  // ...
  integrations: [prefetch()],
}
```

```html
<!-- Prefetch HTML and stylesheets for the /products page -->
<a href="/products" rel="prefetch">All Products</a>
```
