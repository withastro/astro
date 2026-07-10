---
'astro': minor
---

Adds a new experimental `collectionStorage` option for controlling how the content layer persists its data store

By default, Astro serializes the entire content layer data store to a single file (`.astro/data-store.json`). For very large content collections, this file can grow large enough to hit platform file-size limits.

Set `experimental.collectionStorage: 'chunked'` to instead split the data store across many smaller, content-addressed files inside a `.astro/data-store/` directory, described by a manifest:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    collectionStorage: 'chunked',
  },
});
```

Because each part file is named by a hash of its contents, unchanged parts keep the same name across builds and are not rewritten, and identical parts are deduplicated. The default value is `'single-file'`, which preserves the current behavior.
