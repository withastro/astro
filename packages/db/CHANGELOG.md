# @astrojs/db

## 0.8.0

### Minor Changes

- [#10395](https://github.com/withastro/astro/pull/10395) [`a49892349ecee2b5d3184e59ac0ab54368481672`](https://github.com/withastro/astro/commit/a49892349ecee2b5d3184e59ac0ab54368481672) Thanks [@matthewp](https://github.com/matthewp)! - Sets new Astro Studio production URL

### Patch Changes

- [#10396](https://github.com/withastro/astro/pull/10396) [`41ca94e5136a80a58d000f3eb87029442599a4a3`](https://github.com/withastro/astro/commit/41ca94e5136a80a58d000f3eb87029442599a4a3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove risk of data loss when pushing an out-of-date table schema.

- [#10374](https://github.com/withastro/astro/pull/10374) [`f76dcb769f6869acb96b2a77898926f109f54a33`](https://github.com/withastro/astro/commit/f76dcb769f6869acb96b2a77898926f109f54a33) Thanks [@itsMapleLeaf](https://github.com/itsMapleLeaf)! - Expose DB utility types from @astrojs/db/types

## 0.7.2

### Patch Changes

- [#10391](https://github.com/withastro/astro/pull/10391) [`9667ee990ca2a02a146e442f2494981df4c88b52`](https://github.com/withastro/astro/commit/9667ee990ca2a02a146e442f2494981df4c88b52) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove @astrojs/runtime/config suggestion for astro:db configuration helpers.

- [#10385](https://github.com/withastro/astro/pull/10385) [`38abae47b57af481a8dcdf2393317de6df46920a`](https://github.com/withastro/astro/commit/38abae47b57af481a8dcdf2393317de6df46920a) Thanks [@delucis](https://github.com/delucis)! - Fixes support for integrations configuring `astro:db` and for projects that use `astro:db` but do not include a seed file.

- [#10381](https://github.com/withastro/astro/pull/10381) [`8cceab587d681d90842184904182833117687750`](https://github.com/withastro/astro/commit/8cceab587d681d90842184904182833117687750) Thanks [@delucis](https://github.com/delucis)! - Fixes builds for projects using integration seed files

- [#10384](https://github.com/withastro/astro/pull/10384) [`cd5e8d4b9309e43f5bf884a0014b8a5769d816e0`](https://github.com/withastro/astro/commit/cd5e8d4b9309e43f5bf884a0014b8a5769d816e0) Thanks [@matthewp](https://github.com/matthewp)! - Upgrades the `@libsql/client` dependency to fix the use of `db.batch` in StackBlitz

- [#10387](https://github.com/withastro/astro/pull/10387) [`8a23ee530cd1d7d7b4e93e9e72f4e06d1fc3d845`](https://github.com/withastro/astro/commit/8a23ee530cd1d7d7b4e93e9e72f4e06d1fc3d845) Thanks [@FredKSchott](https://github.com/FredKSchott)! - handle success=false response on api endpoints

- [#10390](https://github.com/withastro/astro/pull/10390) [`236cdbb611587692d3c781850cb949604677ef82`](https://github.com/withastro/astro/commit/236cdbb611587692d3c781850cb949604677ef82) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Adds `--help` reference for new db and studio CLI commands

## 0.7.1

### Patch Changes

- [#10378](https://github.com/withastro/astro/pull/10378) [`41dca1e413c2f1e38f0326bd6241ccbf9b8ee0e4`](https://github.com/withastro/astro/commit/41dca1e413c2f1e38f0326bd6241ccbf9b8ee0e4) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Handle new schema API response format

## 0.7.0

### Minor Changes

## 0.7.0

### Breaking Changes

- The seed file now requires an `export default async function()` wrapper
- `defineDB` has been renamed to `defineDb`

### Minor Changes

- [#10334](https://github.com/withastro/astro/pull/10334) [`bad9b583a267e239ba52237d45a89063ea277200`](https://github.com/withastro/astro/commit/bad9b583a267e239ba52237d45a89063ea277200) Thanks [@delucis](https://github.com/delucis)! - Changes the seed file format to require exporting a default function instead of running seed code at the top level.

  To migrate a seed file, wrap your existing code in a default function export:

  ```diff
  // db/seed.ts
  import { db, Table } from 'astro:db';

  + export default async function() {
    await db.insert(Table).values({ foo: 'bar' });
  + }
  ```

- [#10352](https://github.com/withastro/astro/pull/10352) [`06fe94e29de97290cb41c4f862ab88f48cda3d4a`](https://github.com/withastro/astro/commit/06fe94e29de97290cb41c4f862ab88f48cda3d4a) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Introduce `astro build --remote` to build with a remote database connection. Running `astro build` plain will use a local database file, and `--remote` will authenticate with a studio app token.

- [#10321](https://github.com/withastro/astro/pull/10321) [`2e4958c8a75dc9836efcc7dd272fb8ed4187c000`](https://github.com/withastro/astro/commit/2e4958c8a75dc9836efcc7dd272fb8ed4187c000) Thanks [@delucis](https://github.com/delucis)! - Adds support for integrations providing `astro:db` configuration and seed files, using the new `astro:db:setup` hook.

  To get TypeScript support for the `astro:db:setup` hook, wrap your integration object in the `defineDbIntegration()` utility:

  ```js
  import { defineDbIntegration } from '@astrojs/db/utils';

  export default function MyDbIntegration() {
    return defineDbIntegration({
      name: 'my-astro-db-powered-integration',
      hooks: {
        'astro:db:setup': ({ extendDb }) => {
          extendDb({
            configEntrypoint: '@astronaut/my-package/config',
            seedEntrypoint: '@astronaut/my-package/seed',
          });
        },
      },
    });
  }
  ```

  Use the `extendDb` method to register additional `astro:db` config and seed files.

  Integration config and seed files follow the same format as their user-defined equivalents. However, often while working on integrations, you may not be able to benefit from Astro’s generated table types exported from `astro:db`. For full type safety and autocompletion support, use the `asDrizzleTable()` utility to wrap your table definitions in the seed file.

  ```js
  // config.ts
  import { defineTable, column } from 'astro:db';

  export const Pets = defineTable({
    columns: {
      name: column.text(),
      age: column.number(),
    },
  });
  ```

  ```js
  // seed.ts
  import { asDrizzleTable } from '@astrojs/db/utils';
  import { db } from 'astro:db';
  import { Pets } from './config';

  export default async function () {
    // Convert the Pets table into a format ready for querying.
    const typeSafePets = asDrizzleTable('Pets', Pets);

    await db.insert(typeSafePets).values([
      { name: 'Palomita', age: 7 },
      { name: 'Pan', age: 3.5 },
    ]);
  }
  ```

- [#10361](https://github.com/withastro/astro/pull/10361) [`988aad6705e5ee129cf3a28da80aca4229052bb3`](https://github.com/withastro/astro/commit/988aad6705e5ee129cf3a28da80aca4229052bb3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add support for batch queries with `db.batch()`. This includes an internal bump to Drizzle v0.29.

### Patch Changes

- [#10357](https://github.com/withastro/astro/pull/10357) [`5a9dab286f3f436f3dce18f3b13a2cd9b774a8ef`](https://github.com/withastro/astro/commit/5a9dab286f3f436f3dce18f3b13a2cd9b774a8ef) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix runtime export error when building with the node adapter

- [#10348](https://github.com/withastro/astro/pull/10348) [`9f422e9bd338c1f6deee8f727143bf801a6b1651`](https://github.com/withastro/astro/commit/9f422e9bd338c1f6deee8f727143bf801a6b1651) Thanks [@matthewp](https://github.com/matthewp)! - Rename `experimentalVersion` to `version`

- [#10364](https://github.com/withastro/astro/pull/10364) [`3f27e096283b6b477c4a66d0a7df52feaa3f4233`](https://github.com/withastro/astro/commit/3f27e096283b6b477c4a66d0a7df52feaa3f4233) Thanks [@delucis](https://github.com/delucis)! - Renames the Astro DB `defineDB()` helper to `defineDb()`

## 0.6.5

### Patch Changes

- [#10350](https://github.com/withastro/astro/pull/10350) [`393ad9b2aa9fde45eb14b8b01ff3526063772452`](https://github.com/withastro/astro/commit/393ad9b2aa9fde45eb14b8b01ff3526063772452) Thanks [@Fryuni](https://github.com/Fryuni)! - Includes `./virtual.d.ts` file that was previously unpublished

## 0.6.4

### Patch Changes

- [#10342](https://github.com/withastro/astro/pull/10342) [`a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec`](https://github.com/withastro/astro/commit/a2e9b2b936666b2a4779feb00dcb8ff0ab82c2ec) Thanks [@matthewp](https://github.com/matthewp)! - Fixes @astrojs/db loading TS in the fixtures

## 0.6.3

### Patch Changes

- [#10340](https://github.com/withastro/astro/pull/10340) [`a60861c960bf3d24af9b2784b5b333855c968731`](https://github.com/withastro/astro/commit/a60861c960bf3d24af9b2784b5b333855c968731) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Ensure `astro:db` types exist in your `db/config.ts` before running type generation.

## 0.6.2

### Patch Changes

- [#10336](https://github.com/withastro/astro/pull/10336) [`f2e60a96754ed1d86001fe4d5d3a0c0ef657408d`](https://github.com/withastro/astro/commit/f2e60a96754ed1d86001fe4d5d3a0c0ef657408d) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add back confirmation handling on verify and push

## 0.6.1

### Patch Changes

- [#10315](https://github.com/withastro/astro/pull/10315) [`78ddfadbf9cc5a12a9bd25eab64ec8ec1bd8617d`](https://github.com/withastro/astro/commit/78ddfadbf9cc5a12a9bd25eab64ec8ec1bd8617d) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix type definitions for `astro:db`

## 0.6.0

### Minor Changes

- [#10312](https://github.com/withastro/astro/pull/10312) [`93ec9e264a1dbdff61233289418612f558508135`](https://github.com/withastro/astro/commit/93ec9e264a1dbdff61233289418612f558508135) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Revamp migrations system

### Patch Changes

- [#10313](https://github.com/withastro/astro/pull/10313) [`cb00c8b6927242369debe92ad2bc7e791616696a`](https://github.com/withastro/astro/commit/cb00c8b6927242369debe92ad2bc7e791616696a) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix bad package.json types

## 0.5.0

### Minor Changes

- [#10280](https://github.com/withastro/astro/pull/10280) [`3488be9b59d1cb65325b0e087c33bcd74aaa4926`](https://github.com/withastro/astro/commit/3488be9b59d1cb65325b0e087c33bcd74aaa4926) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Finalize db API to a shared db/ directory.

## 0.4.1

### Patch Changes

- [#10223](https://github.com/withastro/astro/pull/10223) [`aa45eb9fa60b254e859750d9cef671daa605b213`](https://github.com/withastro/astro/commit/aa45eb9fa60b254e859750d9cef671daa605b213) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix: use correct remote database url during production builds

- [#10207](https://github.com/withastro/astro/pull/10207) [`5d4ff093a21c072553b2cac6c799d3efa3cb84c0`](https://github.com/withastro/astro/commit/5d4ff093a21c072553b2cac6c799d3efa3cb84c0) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Improve error messaging when seeding invalid data.

## 0.4.0

### Minor Changes

- [`f85ace2e66370e522b5a4e9b54c578a02298fe0e`](https://github.com/withastro/astro/commit/f85ace2e66370e522b5a4e9b54c578a02298fe0e) Thanks [@matthewp](https://github.com/matthewp)! - @astrojs/db prerelease
