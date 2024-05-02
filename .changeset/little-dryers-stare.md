---
"@astrojs/preact": minor
---

Adds a `devtools` option

Enabling `devtools` will enable the [official Preact Devtools](https://preactjs.github.io/preact-devtools/) in development:

```js
import { defineConfig } from "astro/config"
import preact from "@astrojs/preact"

export default defineConfig({
    integrations: [
        preact({ devtools: true })
    ]
})
```
