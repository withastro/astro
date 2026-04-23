# Preview release

You can install the preview release with:

```
npm i https://pkg.pr.new/astro@16366
```

To try it out, update your Astro config:

```js
export default defineConfig({
  experimental: {
    advancedRouting: true
  }
});
```

## Quick start with `astro()`

Create a `src/app.ts` that uses the combined `astro()` handler, which runs the full pipeline:

```ts
import { FetchState, astro } from 'astro/fetch';

export default {
  fetch(request: Request) {
    const state = new FetchState(request);
    return astro(state);
  }
};
```

Or with Hono:

```ts
import { astro } from 'astro/hono';
import { Hono } from 'hono';

const app = new Hono();
app.use(astro());

export default app;
```

## Individual feature handlers

Instead of the combined `astro()`, you can compose individual handlers to control exactly what runs and in what order. Each pipeline step is available as a separate function in both `astro/fetch` and `astro/hono`.

### Hono example

New to Hono? Check out the [Hono documentation](https://hono.dev/docs/) to learn more.

```ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { actions, middleware, pages, i18n } from 'astro/hono';

const app = new Hono();

// Your own middleware runs first.
app.use(logger());
app.use(async (c, next) => {
  if (new URL(c.req.url).pathname.startsWith('/admin')) {
    return c.redirect('/login');
  }
  return next();
});

// Astro Actions (RPC + form).
app.use(actions());

// User middleware from src/middleware.ts.
app.use(middleware());

// Page rendering.
app.use(pages());

// i18n post-processing.
app.use(i18n());

export default app;
```

### Fetch example

```ts
import { FetchState, actions, middleware, pages, i18n, trailingSlash } from 'astro/fetch';

export default {
  async fetch(request: Request) {
    const state = new FetchState(request);
    await state.resolveRouteData();

    const redirect = trailingSlash(state);
    if (redirect) return redirect;

    const actionResponse = actions(state);
    if (actionResponse) {
      const result = await actionResponse;
      if (result) return result;
    }

    let response = await middleware(state, (s) => pages(s));
    response = await i18n(state, response);
    return response;
  }
};
```

## Available handlers

| Handler | `astro/fetch` | `astro/hono` | Description |
|---|---|---|---|
| `astro` | `astro(state)` | `astro()` | Combined handler — runs the full pipeline |
| `trailingSlash` | `trailingSlash(state)` | `trailingSlash()` | Trailing slash redirect enforcement |
| `redirects` | `redirects(state)` | `redirects()` | Config-defined redirects |
| `sessions` | `sessions(state)` | `sessions()` | Session provider registration |
| `actions` | `actions(state)` | `actions()` | Astro Actions (RPC + form) |
| `middleware` | `middleware(state, next)` | `middleware()` | User middleware from `src/middleware.ts` |
| `pages` | `pages(state)` | `pages()` | Page/endpoint rendering |
| `cache` | `cache(state, next)` | `cache(next)` | Cache provider wrapping |
| `i18n` | `i18n(state, response)` | `i18n()` | i18n locale redirects + fallbacks |
