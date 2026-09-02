---
'astro': minor
---

Adds `image()` from `astro/content/image` for content collection schemas, and deprecates the `image` schema context property

Images in collection entries were previously declared with the `image` helper passed to a `schema` function, which was a Zod schema factory and therefore only worked with Zod. `image()` from `astro/content/image` is an ordinary function you call from inside a schema transform instead, so it works with any validator and its result can be validated further:

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
      cover: z
        .string()
        .transform((src) => image(context, { src }))
        .refine((cover) => cover.width >= 1000, 'cover must be at least 1000px wide'),
    }),
});

export const collections = { blog };
```

Sources are now resolved while your content is synced, so a missing image, a Vite alias, or a root-absolute path is reported as an error up front rather than at read time, and the image's `width`, `height`, and `format` are available to your schema.

The `({ image })` form still works and continues to accept the same sources, but it is deprecated and will be removed in Astro 8:

```diff
- schema: ({ image }) => z.object({
-   cover: image(),
- })
+ schema: (context) => z.object({
+   cover: z.string().transform((src) => image(context, { src })),
+ })
```
