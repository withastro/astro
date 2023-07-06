---
'astro': minor
---

Now you can tell Astro if an adapter supports certain features.

When creating ad adapter, you can specify an object like this:

```js
// adapter.js
setAdapter({
    // ...
    supportsFeatures: {
        edgeMiddleware: "Experimental"
    }
})
```
