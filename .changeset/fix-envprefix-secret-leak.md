---
'astro': patch
---

Prevents `vite.envPrefix` misconfiguration from exposing `access: "secret"` environment variables in client-side bundles. Astro now throws a clear error at startup if any `vite.envPrefix` entry matches a variable declared with `access: "secret"` in `env.schema`.

For example, the following configuration will throw an error for `API_SECRET` because it's defined as `secret` its name matches `['PUBLIC_', 'API_']` defined in `env.schema`:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      API_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      API_URL: envField.string({ context: 'server', access: 'public', optional: true }),
    }
  },
  vite: {
    envPrefix: ['PUBLIC_', 'API_'],
  },
})
```
