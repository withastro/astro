---
'@astrojs/preact': minor
---

Adds support for passing a Babel config to the Preact Vite Plugin:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [
    preact({
      babel: {
        generatorOpts: {
          importAttributesKeyword: 'with',
        },
      },
    }),
  ],
});
```
