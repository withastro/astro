---
"astro": minor
---

Adds experimental support for the `astro:env` API.

The `astro:env` API lets you configure a type-safe schema for your environment variables, and indicate whether they should be available on the server or the client. Import and use your defined variables from the appropriate `/client` or `/server` module:

```astro
---
import { PUBLIC_APP_ID } from "astro:env/client"
import { PUBLIC_API_URL, getSecret } from "astro:env/server"
const API_TOKEN = getSecret("API_TOKEN")

const data = await fetch(`${PUBLIC_API_URL}/users`, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${API_TOKEN}`
	},
	body: JSON.stringify({ appId: PUBLIC_APP_ID })
})
---
```

To define the data type and properties of your environment variables, declare a schema in your Astro config in `experimental.env.schema`. The `envField` helper allows you define your variable as a string, number, or boolean and pass properties in an object:

```js
// astro.config.mjs
import { defineConfig, envField } from "astro/config"

export default defineConfig({
    experimental: {
        env: {
            schema: {
                PUBLIC_API_URL: envField.string({ context: "client", access: "public", optional: true }),
                PUBLIC_PORT: envField.number({ context: "server", access: "public", default: 4321 }),
                API_SECRET: envField.string({ context: "server", access: "secret" }),
            }
        }
    }
})
```

There are currently 3 data types supported: strings, numbers and booleans.

There are three kinds of variables, determined by the combination of `context` (`client` or `server`) and `access` (`private` or `public`) settings defined in your [`env.schema`](#experimentalenvschema):

- **Public client variables**: These variables end up in both your final client and server bundles, and can be accessed from both client and server through the `astro:env/client` module:

    ```js
    import { PUBLIC_API_URL } from "astro:env/client"
    ```

- **Public server variables**: These variables end up in your final server bundle and can be accessed on the server through the `astro:env/server` module:

    ```js
    import { PUBLIC_PORT } from "astro:env/server"
    ```

- **Secret server variables**: These variables are not part of your final bundle and can be accessed on the server through the `getSecret()` helper function available from the `astro:env/server` module:

    ```js
    import { getSecret } from "astro:env/server"

    const API_SECRET = getSecret("API_SECRET") // typed
    const SECRET_NOT_IN_SCHEMA = getSecret("SECRET_NOT_IN_SCHEMA") // string | undefined
    ```

**Note:** Secret client variables are not supported because there is no safe way to send this data to the client. Therefore, it is not possible to configure both `context: "client"` and `access: "secret"` in your schema.

To learn more, check out [the documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalenv).