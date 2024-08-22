---
'astro': major
---

The `astro:env` feature introduced behind a flag in [v4.10.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#x4100) is no longer experimental and is available for general use. If you have been waiting for stabilization before using `astro:env`, you can now do so.

This feature lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client.

To configure a schema, add the `env` option to your Astro config and define your client and server variables. If you were previously using this feature, please remove the experimental flag from your Astro config and move your entire `env` configuration unchanged to a top-level option.

```js
import { defineConfig, envField } from 'astro/config'

export default defineConfig({
  env: {
    schema: {
      API_URL: envField.string({ context: "client", access: "public", optional: true }),
      PORT: envField.number({ context: "server", access: "public", default: 4321 }),
      API_SECRET: envField.string({ context: "server", access: "secret" }),
    }
  }
})
```

You can import and use your defined variables from the appropriate `/client` or `/server` module:

```astro
---
import { API_URL } from "astro:env/client"
import { API_SECRET_TOKEN } from "astro:env/server"

const data = await fetch(`${API_URL}/users`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_SECRET_TOKEN}`
  },
})
---

<script>
import { API_URL } from "astro:env/client"

fetch(`${API_URL}/ping`)
</script>
```

Please see our [guide to using environment variables](https://docs.astro.build/en/guides/environment-variables/#astroenv) for more about this feature.
