---
"@astrojs/solid-js": minor
---

Adds a `devtools` option

You can enable the [official Solid Devtools](https://github.com/thetarnav/solid-devtools) while working in development mode by setting `devtools:true` in your `solid()` integration config:

```js
import { defineConfig } from "astro/config"
import solid from "@astrojs/solid-js"

export default defineConfig({
    integrations: [
        solid({ devtools: true })
    ]
})
```