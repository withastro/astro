---
'@astrojs/markdoc': patch
---

Add support for syntax highlighting with Shiki. Install `shiki` in your project with `npm i shiki`, and apply to your Markdoc config using the `extends` option:

```js
// markdoc.config.mjs
import { defineMarkdocConfig, shiki } from '@astrojs/markdoc/config';
export default defineMarkdocConfig({
  extends: [
    await shiki({ /** Shiki config options */ }),
  ],
})
```

Learn more in the [`@astrojs/markdoc` README.](https://docs.astro.build/en/guides/integrations-guide/markdoc/#syntax-highlighting)
