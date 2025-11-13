---
'astro': patch
---

Updates the experimental Fonts API to allow for more granular configuration of remote font families

A font family is defined by a combination of properties such as weights and styles (e.g. `weights: [500, 600]` and `styles: ["normal", "bold"]`), but you may want to download only certain combinations of these.

For greater control over which font files are downloaded, you can specify the same font (ie. with the same `cssVariable`, `name`, and `provider` properties) multiple times with different combinations and Astro will merge the results and download only the required files. For example, it is possible to download normal `500` and `600` while downloading only italic `500`:

```js
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
