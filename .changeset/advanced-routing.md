---
'astro': minor
---

Adds a new `experimental.advancedRouting` option that lets you take full control of Astro's request handling pipeline by creating a `src/app.ts` file in your project.

Today, Astro handles every incoming request through a fixed internal pipeline: trailing slash normalization, redirects, actions, middleware, page rendering, i18n, and so on. That pipeline works great for most sites, but as projects grow you often want to run your own logic *between* those steps — an auth check before rendering, a rate limiter before actions, custom logging around the whole stack. Advanced routing gives you that control.

When enabled, Astro looks for a `src/app.ts` file in your project. If it finds one, that file becomes the entrypoint for all server-rendered requests. You compose the pipeline yourself using the handlers Astro provides, and you can slot your own logic anywhere in the chain.

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

#### Two ways to build your pipeline

Astro ships two entrypoints for advanced routing: `astro/fetch` and `astro/hono`.

**`astro/fetch`** is a low-level, framework-free API built on the Web Fetch standard. You create a `FetchState` from the incoming request, then call handler functions in sequence. Each handler takes the state, does its work, and returns a `Response` (or `undefined` to pass through). This is the core primitive that everything else is built on:

```ts
// src/app.ts
import {
  FetchState, trailingSlash, redirects,
  actions, middleware, pages, i18n
} from 'astro/fetch';

export default {
  async fetch(request: Request) {
    const state = new FetchState(request);

    // Early exits — these return a Response only when they apply.
    const slash = trailingSlash(state);
    if (slash) return slash;

    const redirect = redirects(state);
    if (redirect) return redirect;

    const action = await actions(state);
    if (action) return action;

    // Middleware wraps page rendering; i18n post-processes the response.
    const response = await middleware(state, () => pages(state));
    return i18n(state, response);
  }
};
```

**`astro/hono`** wraps the same handlers as [Hono](https://hono.dev) middleware, so you can mix Astro's pipeline with Hono's ecosystem of middleware (logger, CORS, JWT, rate limiting, etc.) using the `app.use()` pattern you already know:

```ts
// src/app.ts
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { logger } from 'hono/logger';
import { actions, middleware, pages, i18n } from 'astro/hono';

const app = new Hono();

app.use(logger());

// Auth gate — only runs for /dashboard routes.
app.use('/dashboard/*', async (c, next) => {
  const session = getCookie(c, 'session');
  if (!session) return c.redirect('/login');
  return next();
});

app.use(actions());
app.use(middleware());
app.use(pages());
app.use(i18n());

export default app;
```

Both approaches give you the same power — pick whichever fits your project. If you don't need a framework, `astro/fetch` keeps things minimal. If you want a rich middleware ecosystem, `astro/hono` gets you there with one import.
