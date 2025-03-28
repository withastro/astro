---
'@astrojs/cloudflare': minor
---

Automatically configures Cloudflare KV storage when experimental sessions are enabled


If the `experimental.session` flag is enabled when using the Cloudflare adapter, Astro will automatically configure the session storage using the Cloudflare KV driver. You can still manually configure the session storage if you need to use a different driver or want to customize the session storage configuration. If you want to use sessions, you will need to create the KV namespace and declare it in your wrangler config. You can do this using the Wrangler CLI:

```sh
npx wrangler kv namespace create SESSION
```

This will log the id of the created namespace. You can then add it to your `wrangler.json`/`wrangler.toml` file like this:

```jsonc
// wrangler.json
{
  "kv_namespaces": [
    {
      "binding": "SESSION",
      "id": "<your kv namespace id here>"
    }
  ]
}
```

By default it uses the binding name `SESSION`, but if you want to use a different binding name you can do so by passing the `sessionKVBindingName` option to the adapter. For example:

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'server',
  site: `http://example.com`,
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    sessionKVBindingName: 'MY_SESSION',
  }),
  experimental: {
    session: true,
  }
});

```

See [the Cloudflare KV docs](https://developers.cloudflare.com/kv/concepts/kv-namespaces/) for more details on setting up KV namespaces.

See [the experimental session docs](https://docs.astro.build/en/reference/experimental-flags/sessions/) for more information on configuring session storage.
