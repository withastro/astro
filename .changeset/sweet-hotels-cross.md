---
'@astrojs/netlify': minor
---

Adds support for the [experimental static headers Astro feature](https://docs.astro.build/en/reference/adapter-reference/#experimentalstaticheaders).

When the feature is enabled via option `experimentalStaticHeaders`, and CSP is enabled, the integration will save the CSP headers to the `config.json` file.

```js
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

export default defineConfig({
  adapter: netlify({
    experimentalStaticHeaders: true
  }),
  experimental: {
    cps: true
  }
})
```
