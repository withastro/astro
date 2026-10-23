---
'astro': minor
---

Adds `image()` from `astro/content/image` for content collection schemas, and deprecates the `image` property of the schema context

Images in collection entries were declared with the `image` helper passed to a `schema` function. That helper was a Zod schema factory, so it only worked with Zod and its result could not be validated any further. `image()` from `astro/content/image` is an ordinary function you call from inside a schema transform instead, so it works with any validator:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { image } from 'astro/content/image';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
  schema: (context) =>
    z.object({
      cover: z.string().transform((src) => image(context, { src })),
    }),
});

export const collections = { blog };
```

Sources are now resolved while your content is synced, so a missing image, a Vite alias, or a root-absolute path is reported as an error up front rather than at read time. A local image's `width`, `height`, and `format` are read from the file during that resolution, which means your schema can validate them and a transform downstream of `image()` can use them:

```ts
cover: z
  .string()
  .transform((src) => image(context, { src }))
  .refine((cover) => (cover.width ?? 0) >= 1000, 'cover must be at least 1000px wide'),
```

#### Migrating from `({ image })`

The `({ image })` form still works and continues to accept the same sources, but it is deprecated and will be removed in a future major version:

```diff
- schema: ({ image }) => z.object({
-   cover: image(),
- })
+ schema: (context) => z.object({
+   cover: z.string().transform((src) => image(context, { src })),
+ })
```
