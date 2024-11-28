---
'astro': minor
---

Adds a new property to the globals `Astro` and `APIContext` called `routePattern`. The `routePattern` represents the current route (component)
that is being rendered by Astro. It's usually a path pattern will look like this: `blog/[slug]`:

```astro
---
// src/pages/blog/[slug].astro
const route = Astro.routePattern;
console.log(route); // it will log "blog/[slug]"
---
```

```js
// src/pages/index.js

export const GET = (ctx) => {
  console.log(ctx.routePattern) // it will log src/pages/index.js
  return new Response.json({ loreum: "ipsum" })
}
```


