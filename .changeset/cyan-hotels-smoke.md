---
'astro': minor
---

Adds `image()` from `astro/content/fields` for content collection schemas, and deprecates schema factories and the schema context's `image` property

Images in collection entries were declared with the `image` helper passed to a `schema` function. That helper was a Zod schema factory, so it only worked with Zod and its result could not be validated any further. `image()` from `astro/content/fields` is an ordinary function you call from inside a schema transform instead, so it works with any validator:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { image } from 'astro/content/fields';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
  schema: z.object({
    cover: z.string().transform((src) => image(src)),
  }),
});

export const collections = { blog };
```

#### Migrating from `({ image })`

The `({ image })` helper and `schema: (context) => ...` form still work, but they are deprecated. Replace them with a static schema and `image(src)`:

```diff
- schema: ({ image }) => z.object({
-   cover: image(),
- })
+ schema: z.object({
+   cover: z.string().transform((src) => image(src)),
+ })
```
