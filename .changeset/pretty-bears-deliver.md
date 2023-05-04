---
'astro': minor
---

Implements a new experimental middleware in Astro.

The middleware is available under the following experimental flag:

```js
export default defineConfig({
    experimental: {
        middleware: true
    }
})
```

Or via CLI, using the new argument `--experimental-middleware`.

Create a file called `middleware.{js,ts}` inside the `src` folder, and 
export a `onRequest` function. 

From `astro/middleware`, use the `defineMiddleware` utility to take advantage of type-safety, and use
the `sequence` utility to chain multiple middleware functions.

Example:

```ts
import {defineMiddleware, sequence} from "astro/middleware";

const redirects = defineMiddleware((context, next) => {
  if (context.request.url.endsWith("/old-url")) {
    return context.redirect("/new-url")    
  }
  return next();
});

const minify = defineMiddleware(async (context, next) => {
  const repsonse = await next();
  const minifiedHtml = await minifyHtml(response.text());
  return new Response(minifiedHtml, {
    status: 200,
    headers: response.headers
  });
})

export const onRequest = sequence(redirects, minify);
```
