---
'astro': patch
---

Adds a feature to `experimental.collectionStorage` that allows to change the size of chunks.

For example, you can reduce the size of chunks to 1MB:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    collectionStorage: {
      type: 'chunked',
      chunkSize: 1024 * 1024,
    }
  }
})
```
