---
'astro': patch
---

Updates the experimental Fonts API to allow merging font families

Before, it was not possible to only download font files for weights normal `500`, italic `500` and normal `600`. This is because a font family is defined by a combination of weights and styles, so you'd necessarily have to also download italic `600`.

Now, families that have the same `cssVariable`, `name` and `provider` will be merged. That means you could achieve the desired result like this:

```ts
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
    experimental: {
        fonts: [
            {
                name: "Roboto",
                cssVariable: "--roboto",
                provider: fontProviders.google(),
                weights: [500, 600],
                styles: ["normal"]
            },
            {
                name: "Roboto",
                cssVariable: "--roboto",
                provider: fontProviders.google(),
                weights: [500],
                styles: ["italic"]
            }
        ]
    }
})
```
