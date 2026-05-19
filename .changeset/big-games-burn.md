---
'astro': minor
---

Adds `context.styles`, `context.scripts`, and `context.links` to the middleware and page context, exposing the route's assets:

- `context.styles` — inline CSS strings
- `context.links` — external stylesheet URLs
- `context.scripts` — external script URLs

```ts
// src/middleware.ts
export const onRequest = async (context, next) => {
  const response = await next();
  for (const href of context.links) {
    response.headers.append('Link', `<${href}>; rel=preload; as=style`);
  }
  return response;
};
```
