---
"@astrojs/vue": minor
---

Updates the `devtools` type to allow passing a boolean or `VueDevToolsOptions`. This is useful to set `launchEditor` if you're not using Visual Studio Code for example:

```js
import { defineConfig } from "astro/config"
import vue from "@astrojs/vue"

export default defineConfig({
  integrations: [
    vue({
      // devtools: true is equivalent to {}
      devtools: {
        launchEditor: "webstorm"
      }
    })
  ]
})
```
