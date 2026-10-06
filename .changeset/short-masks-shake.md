---
'astro': minor
---

Adds a `notFound()` handler to `astro/fetch` and `astro/hono` that renders the custom 404 page when no route matches, including a prerendered `404.astro`

Add it before `pages()` in a custom worker or server entrypoint that does not run inside `App.render`, such as a Hono app used directly as a Cloudflare worker. Without it, `pages()` and `middleware()` return an empty 404 with an internal `X-Astro-Error` header for unmatched routes. `astro()` already includes this handling.

```ts
import { Hono } from 'hono';
import { notFound, pages } from 'astro/hono';
import { cf } from '@astrojs/cloudflare/hono';

const app = new Hono();
app.use(cf());
app.use(notFound());
app.use(pages());
export default app;
```
