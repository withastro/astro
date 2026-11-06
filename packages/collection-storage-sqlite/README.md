# @astrojs/collection-storage-sqlite

Keeps the entries of Astro content collections in a SQLite or [libSQL](https://github.com/tursodatabase/libsql) database, such as a local file or a remote [Turso](https://turso.tech) database, instead of the data store bundled with your site.

This package requires the experimental `collectionStorageDrivers` flag.

## Installation

Install the driver together with the libSQL client:

```sh
pnpm add @astrojs/collection-storage-sqlite @libsql/client
```

`@libsql/client` must be a dependency of your project, not only of this package. The server build only leaves it out of the bundle when it can find it from your project, and libSQL can't load its native binding from a bundle.

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    collectionStorageDrivers: true,
  },
});
```

```ts
// src/content.config.ts
import { sqlite } from '@astrojs/collection-storage-sqlite';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/docs' }),
  storage: sqlite({
    url: 'libsql://docs-example.turso.io',
    authTokenEnv: 'DOCS_DATABASE_TOKEN',
  }),
});

export const collections = { docs };
```

## Options

### `url`

The URL of the database: `file:` followed by a path for a local SQLite file, or the `libsql://` or `https://` URL of a remote database. Relative paths start from the directory where Astro runs.

### `authTokenEnv`

The name of the environment variable that holds the auth token of a remote database. The driver reads it with `getSecret()` from `astro:env/server` when it starts, at build time and at runtime, so the token is never written into your build. At build time, the variable can come from a `.env` file. At runtime, it comes from the environment your adapter provides.

## Snapshots

Each build writes its collections to a new snapshot, and the server it produces only reads that snapshot. A dev server writes a single snapshot, again after each change.

Astro never deletes snapshots, as it can't know which ones deployed servers still read. To reclaim space, remove old snapshots from an integration, with the `collections.storage` option of the `astro:build:done` hook. This driver lists and deletes snapshots:

```js
// Keeps the 5 most recent build snapshots
'astro:build:done': async ({ collections }) => {
  for (const storage of collections.storage ?? []) {
    const builds = (await storage.listSnapshots())
      .filter((snapshot) => !snapshot.dev)
      .sort((a, b) => b.committedAt.getTime() - a.committedAt.getTime());
    for (const { snapshot } of builds.slice(5)) {
      await storage.deleteSnapshot(snapshot);
    }
  }
},
```

The driver only runs in Node: this package doesn't ship a web version. Runtimes without Node APIs, such as Cloudflare Workers, need a driver built for them, such as one provided by their adapter.
