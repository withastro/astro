---
'astro': minor
---

Adds a new property to the globals `Astro` and `APIContext` called `prerender`. The `prerender` represents whether or not the current page is prerendered:

```astro
---
// src/pages/index.astro

export const prerender = true
---
```

```js
// src/middleware.js

export const onRequest = (ctx, next) => {
  console.log(ctx.prerender) // it will log true
  return next()
}
```
