---
'astro': minor
---

Adds experimental session support

Sessions are used to store user state between requests for server-rendered pages, such as login status, shopping cart contents, or other user-specific data.

```astro
---
export const prerender = false; // Not needed in 'server' mode
const cart = await Astro.session.get('cart');
---

<a href="/checkout">🛒 {cart?.length ?? 0} items</a>
```

Sessions are available in on-demand rendered/SSR pages, API endpoints, actions and middleware. To enable session support, you must configure a storage driver.

If you are using the Node.js adapter, you can use the `fs` driver to store session data on the filesystem:

```js
// astro.config.mjs
{
  adapter: node({ mode: 'standalone' }),
  experimental: {
    session: {
      // Required: the name of the unstorage driver
      driver: "fs",
    },
  },
}
```
If you are deploying to a serverless environment, you can use drivers such as `redis`, `netlify-blobs`, `vercel-kv`, or `cloudflare-kv-binding` and optionally pass additional configuration options.

For more information, including using the session API with other adapters and a full list of supported drivers, see [the docs for experimental session support](https://docs.astro.build/en/reference/experimental-flags/sessions/). For even more details, and to leave feedback and participate in the development of this feature, [the Sessions RFC](https://github.com/withastro/roadmap/pull/1055).
