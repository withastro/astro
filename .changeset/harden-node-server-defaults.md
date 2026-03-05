---
'astro': patch
'@astrojs/node': minor
---

Adds a new `bodySizeLimit` option to the `@astrojs/node` adapter and hardens standalone server timeouts

You can now configure a maximum allowed request body size for your Node.js standalone server. The default limit is 1 GB. Set the value in bytes, or pass `0` to disable the limit entirely:

```js
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
    bodySizeLimit: 1024 * 1024 * 100, // 100 MB
  }),
});
```

This release also sets stricter default timeouts on the standalone HTTP server (60s request timeout, 30s headers timeout, 10s keep-alive timeout) to better protect against slow or idle connections.
