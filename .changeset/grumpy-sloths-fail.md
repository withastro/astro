---
'astro': minor
---

Adds a new option in the config called `server.allowedHosts` and CLI option called `--allowed-hosts`.

This new option allows to specify the hostnames that the dev server and preview server are allowed to respond to.

```shell
astro dev --allowed-hosts=foo.bar.example.com,bar.example.com
```

```shell
astro preview --allowed-hosts=foo.bar.example.com,bar.example.com
```

```js
// astro.config.mjs
import {defineConfig} from "astro/config";

export default defineConfig({
  server: {
    allowedHosts: ['foo.bar.example.com', 'bar.example.com']
  }
})
```

More information are available in the [Vite documentation](https://vite.dev/config/server-options.html#server-allowedhosts).
