---
'astro': patch
---

Adds a new property `experimental.env.validateSecrets` to allow validating private variables on the server.

By default, this is set to `false` and only public variables are checked on start. If enabled, secrets will also be checked on start (dev/build modes). This is useful for example in some CIs to make sure all your secrets are correctly set before deploying.

```js
// astro.config.mjs
import { defineConfig, envField } from "astro/config"

export default defineConfig({
    experimental: {
        env: {
            schema: {
                // ...
            },
            validateSecrets: true
        }
    }
})
```
