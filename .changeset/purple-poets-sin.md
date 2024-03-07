---
"@astrojs/db": patch
---

Adds support for integrations providing `astro:db` configuration and seed files, using the new `astro:db:setup` hook.

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

export default async function() {
  // Convert the Pets table into a format ready for querying.
  const typeSafePets = asDrizzleTable('Pets', Pets);

  await db.insert(typeSafePets).values([
    { name: 'Palomita', age: 7 },
    { name: 'Pan', age: 3.5 },
  ]);
}
```
