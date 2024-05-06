---
"@astrojs/vue": minor
---

Adds a `devtools` option

You can enable the [official Vue DevTools](https://devtools-next.vuejs.org/) while working in development mode by setting `devtools:true` in your `vue()` integration config:

```js
import { defineConfig } from "astro/config"
import vue from "@astrojs/vue"

export default defineConfig({
    integrations: [
        vue({ devtools: true })
    ]
})
```