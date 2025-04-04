---
'@astrojs/cloudflare': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'astro': minor
---

The experimental session API introduced in Astro 5.1 is now stable and ready for production use.

Sessions are used to store user state between requests for [on-demand rendered pages](https://astro.build/en/guides/on-demand-rendering/). You can use them to store user data, such as authentication tokens, shopping cart contents, or any other data that needs to persist across requests:

```astro
---
export const prerender = false; // Not needed with 'server' output
const cart = await Astro.session.get('cart');
---

<a href="/checkout">🛒 {cart?.length ?? 0} items</a>
```

## Upgrading from Experimental to Stable

If you were previously using the experimental API, you should remove the `experimental.session` flag from your configuration.

```diff
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
   adapter: node({
     mode: "standalone",
   }),
-  experimental: {
-    session: true,
-  },
});
```

## Configuring session storage

Sessions require a storage driver to store the data. The Node, Cloudflare and Netlify adapters automatically configure a default driver for you, but other adapters currently require you to specify a custom storage driver in your configuration.

If you are using an adapter that doesn't have a default driver, or if you want to choose a different driver, you can configure it using the `session` configuration option:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  session: {
    driver: 'upstash',
  },
});
```

## Using sessions

Sessions are available in on-demand rendered pages, API endpoints and middleware. In pages and components, you can access the session using `Astro.session`:

```astro
---
const cart = await Astro.session.get('cart');
---

<a href="/checkout">🛒 {cart?.length ?? 0} items</a>
```

In endpoints and middleware, you can access the session using `context.session`:

```js
export async function GET(context) {
  const cart = await context.session.get('cart');
  return Response.json({ cart });
}
```

If you attempt to access the session when there is no storage driver configured, or in a prerendered page, the session object will be `undefined` and an error will be logged in the console:

```astro
---
export const prerender = true;
const cart = await Astro.session?.get('cart'); // Logs an error. Astro.session is undefined
---
```

See [the sessions guide](https://docs.astro.build/en/guides/sessions/) for more information.
