---
'@astrojs/cloudflare': minor
---

Adds support for the [experimental static headers Astro feature](https://docs.astro.build/en/reference/adapter-reference/#experimentalstaticheaders).

When the feature is enabled via option `experimentalStaticHeaders`, and [experimental Content Security Policy](https://docs.astro.build/en/reference/experimental-flags/csp/) is enabled, the adapter will generate `Response` headers for static pages, which allows support for CSP directives that are not supported inside a `<meta>` tag (e.g. `frame-ancestors`).

```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare({
    experimentalStaticHeaders: true
  }),
  experimental: {
    cps: true
  }
})
```