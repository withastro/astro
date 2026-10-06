---
'@astrojs/content-store-sqlite': minor
---

Adds `@astrojs/content-store-sqlite`, a driver for the experimental `collectionStorage` option that saves content collections in a SQLite or libSQL database, such as [Turso](https://turso.tech)

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { createContentCollectionStorage } from '@astrojs/content-store-sqlite';

export default defineConfig({
  experimental: {
    collectionStorage: {
      type: 'external',
      driver: createContentCollectionStorage({
        url: process.env.CONTENT_DATABASE_URL,
        token: process.env.CONTENT_DATABASE_TOKEN,
      }),
    },
  },
});
```
