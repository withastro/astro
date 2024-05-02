---
"@astrojs/react": minor
---

Adds a `devtools` option

Enabling `devtools` will enable the [official React Devtools](https://react.dev/learn/react-developer-tools) in development:

```js
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

export default defineConfig({
    integrations: [
        react({ devtools: true })
    ]
})
```

This is not needed if you have the browser extension already.