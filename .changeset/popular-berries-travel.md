---
'@astrojs/markdoc': patch
---

Add a built-in extension for syntax highlighting with Prism. Apply to your Markdoc config using the `extends` property:

```js
// markdoc.config.mjs
import { defineMarkdocConfig } from '@astrojs/markdoc/config';
import prism from '@astrojs/markdoc/prism';

export default defineMarkdocConfig({
  extends: [prism()],
})
```

Learn more in the [`@astrojs/markdoc` README.](https://docs.astro.build/en/guides/integrations-guide/markdoc/#syntax-highlighting)
