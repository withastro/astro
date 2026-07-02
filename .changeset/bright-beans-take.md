---
'astro': minor
---

Adds a new `observeDynamicLinks` option to prefetch settings

This option uses a `MutationObserver` to watch for links added to the DOM after the initial page load, ensuring they are captured for prefetching.

This is useful when links are dynamically added to the DOM, for example, inside a component using `server:defer` with top-level await.

```js
// astro.config.js
export default defineConfig({
  prefetch: {
    observeDynamicLinks: true,
  },
})
```
