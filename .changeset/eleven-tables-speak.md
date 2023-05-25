---
'@astrojs/markdoc': patch
---

Add support for syntax highlighting with Shiki. Apply to your Markdoc config using the `extends` property:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import shiki from '@astrojs/markdoc/shiki';

export default defineMarkdocConfig({
  extends: [
    await shiki({ /** Shiki config options */ }),
  ],
})
```

Learn more in the [`@astrojs/markdoc` README.](https://docs.astro.build/en/guides/integrations-guide/markdoc/#syntax-highlighting)
