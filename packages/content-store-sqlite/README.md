# @astrojs/content-store-sqlite

Saves Astro content collections in a SQLite or libSQL database, instead of in Astro's own data store. It's a driver for the experimental `collectionStorage` option.

## Usage

Set the driver in your Astro config, with the URL of the database:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { createContentCollectionStorage } from '@astrojs/content-store-sqlite';

export default defineConfig({
  experimental: {
    collectionStorage: {
      type: 'external',
      driver: createContentCollectionStorage({ url: 'file:content.db' }),
    },
  },
});
```

Then add `storage: 'external'` to each collection that the database should save, and use a loader that supports it, such as `externalGlob()`:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { externalGlob } from 'astro/loaders';

const blog = defineCollection({
  storage: 'external',
  loader: externalGlob({ base: './src/content/blog', pattern: '**/*.md' }),
});

export const collections = { blog };
```

## Options

- `url`: `file:` followed by the path of a local SQLite file, or the URL of a remote libSQL database such as [Turso](https://turso.tech). Relative paths start from the directory where Astro runs.
- `token`: the token to connect to a remote libSQL database.

```js
createContentCollectionStorage({
  url: process.env.CONTENT_DATABASE_URL,
  token: process.env.CONTENT_DATABASE_TOKEN,
});
```

The database needs no setup. The driver creates the `astro_content_entries` and `astro_content_meta` tables the first time it connects.
