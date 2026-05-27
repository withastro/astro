---
'@astrojs/cloudflare': minor
---

Adds `@astrojs/cloudflare/fetch` and `@astrojs/cloudflare/hono` exports for composing Cloudflare-specific setup with Astro's advanced routing handlers.

#### `@astrojs/cloudflare/fetch`

For use with `astro/fetch` in a custom fetch handler:

```ts
import { astro, FetchState } from 'astro/fetch';
import { cf } from '@astrojs/cloudflare/fetch';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const state = new FetchState(request);
    const asset = await cf(state, env, ctx);
    if (asset) return asset;
    return astro(state);
  }
}
```

#### `@astrojs/cloudflare/hono`

For use with `astro/hono` as Hono middleware:

```ts
import { Hono } from 'hono';
import { actions, middleware, pages, i18n } from 'astro/hono';
import { cf } from '@astrojs/cloudflare/hono';

const app = new Hono<{ Bindings: Env }>();

app.use(cf());
app.use(actions());
app.use(middleware());
app.use(pages());
app.use(i18n());

export default app;
```

Both handlers configure SESSION KV bindings, static asset serving via the ASSETS binding, `locals.cfContext`, client address, `waitUntil`, and prerendered error page fetch.
