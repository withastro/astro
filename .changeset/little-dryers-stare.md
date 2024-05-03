---
"@astrojs/preact": minor
---

Adds a `devtools` option

You can enable [Preact devtools](https://preactjs.github.io/preact-devtools/) in development by setting `devtools: true` in your `preact()` integration config:

```js
import { defineConfig } from "astro/config"
import preact from "@astrojs/preact"

export default defineConfig({
    integrations: [
        preact({ devtools: true })
    ]
})
```
