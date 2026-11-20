---
'astro': minor
---

Adds `image()` from `astro/content/image` for content collection schemas, and deprecates schema factories and the schema context's `image` property

Images in collection entries were declared with the `image` helper passed to a `schema` function. That helper was a Zod schema factory, so it only worked with Zod and its result could not be validated any further. `image()` from `astro/content/image` is an ordinary function you call from inside a schema transform instead, so it works with any validator. It reads the current entry context during validation, so you can define the schema once:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { image } from 'astro/content/image';
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

Sources are now resolved while your content is synced, so a missing image, a Vite alias, or a root-absolute path is reported as an error up front rather than at read time. A local image's `width`, `height`, and `format` are read from the file during that resolution, which means your schema can validate them and a transform downstream of `image()` can use them:

```ts
cover: z
  .string()
  .transform((src) => image(src))
  .refine((cover) => (cover.width ?? 0) >= 1000, 'cover must be at least 1000px wide'),
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
