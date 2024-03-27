# @astrojs/db

## 0.9.7

### Patch Changes

- [#10587](https://github.com/withastro/astro/pull/10587) [`62a1d6df6916e08cb25d51814dfad352bc4cce75`](https://github.com/withastro/astro/commit/62a1d6df6916e08cb25d51814dfad352bc4cce75) Thanks [@matthewp](https://github.com/matthewp)! - Conditionally drop table with --force-reset

- [#10460](https://github.com/withastro/astro/pull/10460) [`713abb2998bc179443a476f6274432b2fc7d8434`](https://github.com/withastro/astro/commit/713abb2998bc179443a476f6274432b2fc7d8434) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove legacy Astro DB internals using the "collections" naming convention instead of "tables."

## 0.9.6

### Patch Changes

- [#10579](https://github.com/withastro/astro/pull/10579) [`f5df12cfebba1abdef50faa7a5549b545f0b3f8c`](https://github.com/withastro/astro/commit/f5df12cfebba1abdef50faa7a5549b545f0b3f8c) Thanks [@matthewp](https://github.com/matthewp)! - Provide guidance when --remote is missing

  When running the build `astro build` without the `--remote`, either require a `DATABASE_FILE` variable be defined, which means you are going expert-mode and having your own database, or error suggesting to use the `--remote` flag.

- [#10568](https://github.com/withastro/astro/pull/10568) [`764d67fc3f399d62b6a97a2ee698dca03b9f0557`](https://github.com/withastro/astro/commit/764d67fc3f399d62b6a97a2ee698dca03b9f0557) Thanks [@matthewp](https://github.com/matthewp)! - Prevent runtime from importing core code

## 0.9.5

### Patch Changes

- [#10566](https://github.com/withastro/astro/pull/10566) [`b5a80405b93a166f6f019209152b860ffe2f73ef`](https://github.com/withastro/astro/commit/b5a80405b93a166f6f019209152b860ffe2f73ef) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix `db.run()` type signature in production.

## 0.9.4

### Patch Changes

- [#10533](https://github.com/withastro/astro/pull/10533) [`6576f5d458ee8cc872210f3a7ae629439546e361`](https://github.com/withastro/astro/commit/6576f5d458ee8cc872210f3a7ae629439546e361) Thanks [@matthewp](https://github.com/matthewp)! - Ensure ASTRO_STUDIO_APP_TOKEN is found at runtime

## 0.9.3

### Patch Changes

- [#10520](https://github.com/withastro/astro/pull/10520) [`30ce9a0c47a4653a9e9619380a6514459563cf92`](https://github.com/withastro/astro/commit/30ce9a0c47a4653a9e9619380a6514459563cf92) Thanks [@matthewp](https://github.com/matthewp)! - Fix accessing remote database URL

## 0.9.2

### Patch Changes

- [#10506](https://github.com/withastro/astro/pull/10506) [`980020c5e0935a2e0e177164d02f5e49f0a9ab4b`](https://github.com/withastro/astro/commit/980020c5e0935a2e0e177164d02f5e49f0a9ab4b) Thanks [@matthewp](https://github.com/matthewp)! - Ensure --force-reset drops previous tables

## 0.9.1

### Patch Changes

- [#10498](https://github.com/withastro/astro/pull/10498) [`f0fc78c8734b2bcf39078c782998e60b49ecc146`](https://github.com/withastro/astro/commit/f0fc78c8734b2bcf39078c782998e60b49ecc146) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expose `isDbError()` utility to handle database exceptions when querying.

## 0.9.0

### Minor Changes

- [#10479](https://github.com/withastro/astro/pull/10479) [`ad57a02c330b544770ab853fe0521eb784421016`](https://github.com/withastro/astro/commit/ad57a02c330b544770ab853fe0521eb784421016) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Expose Drizzle aggregation helpers including `count()` from the `astro:db` module.

### Patch Changes

- [#10501](https://github.com/withastro/astro/pull/10501) [`48310512601e0c0b2886759e4d81b4091042eb8f`](https://github.com/withastro/astro/commit/48310512601e0c0b2886759e4d81b4091042eb8f) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove `db.transaction()` from type definitions until it is supported by our remote database adapter.

- [#10497](https://github.com/withastro/astro/pull/10497) [`2fc7231df28e5a3425ee47b871ba3766e0856bd8`](https://github.com/withastro/astro/commit/2fc7231df28e5a3425ee47b871ba3766e0856bd8) Thanks [@matthewp](https://github.com/matthewp)! - Remove embedded app token from CI

- [#10405](https://github.com/withastro/astro/pull/10405) [`2ebcf94d0af5ac789c61b4190dea0ad6a402a6ea`](https://github.com/withastro/astro/commit/2ebcf94d0af5ac789c61b4190dea0ad6a402a6ea) Thanks [@43081j](https://github.com/43081j)! - Added github-slugger as a direct dependency

## 0.8.8

### Patch Changes

- [#10477](https://github.com/withastro/astro/pull/10477) [`124cdd64f20d86f936853f3cf834fde8cd6abcb7`](https://github.com/withastro/astro/commit/124cdd64f20d86f936853f3cf834fde8cd6abcb7) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Remove redundant wait time on token creation

## 0.8.7

### Patch Changes

- [#10435](https://github.com/withastro/astro/pull/10435) [`37a485b4d1d4b7e60eee2067ffd86d0eea4f03e8`](https://github.com/withastro/astro/commit/37a485b4d1d4b7e60eee2067ffd86d0eea4f03e8) Thanks [@matthewp](https://github.com/matthewp)! - Fetch new app token when previous has expired

- [#10457](https://github.com/withastro/astro/pull/10457) [`219c49473fe44d8df2b69444b2dce0f5bc971655`](https://github.com/withastro/astro/commit/219c49473fe44d8df2b69444b2dce0f5bc971655) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix type error in db/seed.ts file before type generation is run.

## 0.8.6

### Patch Changes

- [#10439](https://github.com/withastro/astro/pull/10439) [`0989cd3284281e3e471a92ac116e14e65f59f8a5`](https://github.com/withastro/astro/commit/0989cd3284281e3e471a92ac116e14e65f59f8a5) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Add success and error logs to `astro db execute` command

- [#10438](https://github.com/withastro/astro/pull/10438) [`5b48cc0fc8383b0659a595afd3a6ee28b28779c3`](https://github.com/withastro/astro/commit/5b48cc0fc8383b0659a595afd3a6ee28b28779c3) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Generate Astro DB types when running `astro sync`.

## 0.8.5

### Patch Changes

- [#10445](https://github.com/withastro/astro/pull/10445) [`098623c2616124bcc689e2409564dfda187f6688`](https://github.com/withastro/astro/commit/098623c2616124bcc689e2409564dfda187f6688) Thanks [@matthewp](https://github.com/matthewp)! - Prefer getting the app token from the runtime env

- [#10441](https://github.com/withastro/astro/pull/10441) [`5166e9715a1ea18eb5c737ccf834c2ff446d253c`](https://github.com/withastro/astro/commit/5166e9715a1ea18eb5c737ccf834c2ff446d253c) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Remove duplicate astro:db log during type generation

## 0.8.4

### Patch Changes

- [#10443](https://github.com/withastro/astro/pull/10443) [`238f047b9d1ebc407f53d61ee61574b380a76ac9`](https://github.com/withastro/astro/commit/238f047b9d1ebc407f53d61ee61574b380a76ac9) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where `astro:db` could not be used in serverless environments.

## 0.8.3

### Patch Changes

- [#10431](https://github.com/withastro/astro/pull/10431) [`1076864cc4aa4b4dad570bbab9907996642cdd1f`](https://github.com/withastro/astro/commit/1076864cc4aa4b4dad570bbab9907996642cdd1f) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add wait time for the db token to propagate

- [#10432](https://github.com/withastro/astro/pull/10432) [`4e24628aacc556515b27d0c04361df1526ae778f`](https://github.com/withastro/astro/commit/4e24628aacc556515b27d0c04361df1526ae778f) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Add all regions to the link command

## 0.8.2

### Patch Changes

- [#10409](https://github.com/withastro/astro/pull/10409) [`96c8bca19aa477318b5eb48af12b260a6f173e25`](https://github.com/withastro/astro/commit/96c8bca19aa477318b5eb48af12b260a6f173e25) Thanks [@lilnasy](https://github.com/lilnasy)! - Fixes an issue where one table schema could not reference text fields of another table schema.

- [#10428](https://github.com/withastro/astro/pull/10428) [`189ec47c1e3232d8b4db42035ddd44ea862ecfca`](https://github.com/withastro/astro/commit/189ec47c1e3232d8b4db42035ddd44ea862ecfca) Thanks [@FredKSchott](https://github.com/FredKSchott)! - Fix an issue where short-lived tokens were not being authorized

- [#10420](https://github.com/withastro/astro/pull/10420) [`2db25c05a467f2ffd6ebff5eb82076449fa9d72f`](https://github.com/withastro/astro/commit/2db25c05a467f2ffd6ebff5eb82076449fa9d72f) Thanks [@Princesseuh](https://github.com/Princesseuh)! - Fixes some situations where failing requests would not error properly

## 0.8.1

### Patch Changes

- [#10401](https://github.com/withastro/astro/pull/10401) [`a084d8cec66e4fb1952bd0dfe293712401f2f463`](https://github.com/withastro/astro/commit/a084d8cec66e4fb1952bd0dfe293712401f2f463) Thanks [@bholmesdev](https://github.com/bholmesdev)! - Fix astro:db configuration types returning `any`

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
