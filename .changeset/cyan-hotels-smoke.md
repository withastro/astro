---
'astro': minor
---

Adds `image()` from `astro/content/fields` for content collection schemas, and deprecates schema factories and the schema context's `image` property

In a build-time collection, `schema: ({ image }) => ...` provided an `image()` helper that returned a Zod schema. The `image(src)` helper from `astro/content/fields` takes the entry's image path instead, so you can call it from your Standard Schema validator's transform without depending on Zod. Astro resolves local images after validation. Read their dimensions and format from the queried entry.

To migrate `src/content.config.ts`, import the helper and pass the schema directly to `defineCollection()`:

```diff
  import { defineCollection } from 'astro:content';
+ import { image } from 'astro/content/fields';
  import { glob } from 'astro/loaders';
  import { z } from 'astro/zod';

  const blog = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/blog' }),
-   schema: ({ image }) => z.object({
-     cover: image(),
+   schema: z.object({
+     cover: z.string().transform((src) => image(src)),
    }),
  });
```

Astro still supports schema functions, including the `image()` helper on `SchemaContext`. Both are deprecated and will be removed in a future major version.
