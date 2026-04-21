---
'astro': minor
---

Adds a new `experimental.advancedRouting` option that lets you take control of Astro's request handling by creating a `src/app.ts` file in your project.

#### Enabling advanced routing

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    advancedRouting: true,
  },
});
```

#### Using `astro/fetch`

The `astro/fetch` entrypoint gives you direct access to the request pipeline. Import `FetchState` and `astro` to handle requests yourself:

```ts
// src/app.ts
import { FetchState, astro } from 'astro/fetch';

export default {
  fetch(request: Request) {
    const state = new FetchState(request);
    return astro(state);
  }
};
```

This is useful when you want full control over how requests flow through Astro without pulling in an external framework.

#### Using `astro/hono`

If you prefer to compose middleware with [Hono](https://hono.dev), the `astro/hono` entrypoint provides an `astro()` middleware that plugs directly into a Hono app:

```ts
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { astro } from 'astro/hono';

const app = new Hono();

app.use(logger());

app.use(async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/dashboard')) {
    // Check auth before Astro renders
    return c.redirect('/login');
  }
  return next();
});

app.use(astro());

export default app;
```

This lets you add authentication, logging, rate limiting, or any other middleware ahead of Astro's rendering pipeline.
