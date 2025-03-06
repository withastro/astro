---
'@astrojs/markdoc': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds support for a new `experimental.headingIdCompat` flag

By default, Astro removes a trailing `-` from the end of IDs it generates for headings containing
special characters. This differs from the behavior of common Markdown processors.

You can now disable this behavior with a new configuration flag:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    headingIdCompat: true,
  },
});
```

This can be useful when heading IDs and anchor links need to behave consistently across your site
and other platforms such as GitHub and npm.
