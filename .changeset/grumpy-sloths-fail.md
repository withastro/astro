---
'astro': minor
---

Adds a new configuration option `server.allowedHosts` and CLI option `--allowed-hosts`.

Now you can specify the hostnames that the dev and preview servers are allowed to respond to. This is useful for allowing additional subdomains, or running the dev server in a web container.

`allowedHosts` checks the Host header on HTTP requests from browsers and if it doesn't match, it will reject the request to prevent CSRF and XSS attacks.

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

This feature is the same as [Vite's `server.allowHosts` configuration](https://vite.dev/config/server-options.html#server-allowedhosts).
