---
"@astrojs/solid-js": minor
---

Adds a `devtools` option

Enabling `devtools` will enable the [official Solid Devtools](https://github.com/thetarnav/solid-devtools) in development:

```js
import { defineConfig } from "astro/config"
import solid from "@astrojs/solid-js"

export default defineConfig({
    integrations: [
        solid({ devtools: true })
    ]
})
```