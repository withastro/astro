---
'astro': minor
---

Adds a new property to the globals `Astro` and `APIContext` called `route`. The `route` represents the current route (component)
that is being rendered by Astro. It's usually a path that will look like this: `src/pages/blog/[slug].astro`:

```asto
---
// src/pages/index.astro
const route = Astro.route;
console.log(route); // it will log src/pages/index.astro
---
```

```js
// src/pages/index.js

export const GET = (ctx) => {
  console.log(ctx.route) // it will log src/pages/index.js
  return new Response.json({ loreum: "ipsum" })
}
```


