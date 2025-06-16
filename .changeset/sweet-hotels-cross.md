---
'@astrojs/netlify': minor
---

Adds the experimental support for the [static headers Astro feature](https://docs.astro.build/en/reference/adapter-reference/#experimentalstaticheaders).

When the feature is enabled via option `experimentalUseStaticHeaders`, and CSP is enabled, the integration will the CSP headers to the `config.json` file.

```js
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

export default defineConfig({
  adapter: netlify({
    experimentalUseStaticHeaders: true
  }),
  experimental: {
    cps: true
  }
})
```
