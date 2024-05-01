---
"@astrojs/vue": minor
---

Adds a `devtools` option

Enabling `devtools` will enable the [official Vue Devtools](https://github.com/vuejs/devtools-next) in development:

```js
import { defineConfig } from "astro/config"
import vue from "@astrojs/vue"

export default defineConfig({
    integrations: [
        vue({ devtools: true })
    ]
})
```