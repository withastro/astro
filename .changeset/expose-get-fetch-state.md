---
'astro': minor
---

Exposes `getFetchState()` from `astro/hono` as a public API

The `getFetchState()` function retrieves or lazily creates a `FetchState` from a Hono context object. This allows third-party packages to build Hono middleware that interacts with Astro's per-request state, giving the `astro/hono` API the same extensibility as `astro/fetch`.

```ts
import { Hono } from 'hono';
import { getFetchState, pages } from 'astro/hono';

const app = new Hono();

app.use(async (context, next) => {
  const state = getFetchState(context);
  state.locals.message = 'Hello from custom middleware';
  await next();
});

app.use(pages());

export default app;
```
