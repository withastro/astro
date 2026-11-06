---
'@astrojs/collection-storage-sqlite': minor
---

Adds `@astrojs/collection-storage-sqlite`, a collection storage driver that keeps the entries of content collections in a local SQLite file or a remote libSQL database, such as Turso. It requires the experimental `collectionStorageDrivers` flag.

Install it together with `@libsql/client`, which must be a dependency of your project:

```sh
pnpm add @astrojs/collection-storage-sqlite @libsql/client
```

```ts
// src/content.config.ts
import { sqlite } from '@astrojs/collection-storage-sqlite';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/docs' }),
  storage: sqlite({ url: 'libsql://docs-example.turso.io', authTokenEnv: 'DOCS_DATABASE_TOKEN' }),
});
```

The driver reads the auth token of a remote database with `getSecret()` from `astro:env/server`, so the token is never written into your build.

The driver lists and deletes snapshots, so integrations can remove the snapshots of earlier builds in the `astro:build:done` hook.

For more information on enabling and using this feature in your project, see the [experimental collection storage drivers docs](https://docs.astro.build/en/reference/experimental-flags/collection-storage-drivers/).

To share feedback on this feature, comment on the [enhanced content collections RFC](https://github.com/withastro/roadmap/pull/1459).
