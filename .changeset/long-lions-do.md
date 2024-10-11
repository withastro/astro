---
'astro': minor
---

Adds a new property `isPrerendered` to the globals `Astro` and `APIContext` . This boolean value represents whether or not the current page is prerendered:

```astro
---
// src/pages/index.astro

export const prerender = true
---
```

```js
// src/middleware.js

export const onRequest = (ctx, next) => {
  console.log(ctx.isPrerendered) // it will log true
  return next()
}
```
