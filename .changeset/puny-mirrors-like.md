---
'astro': minor
---

Adds support for any [Standard Schema](https://standardschema.dev) validator in content collection schemas

The `schema` of a collection is no longer required to be a Zod schema. Any validator implementing Standard Schema — Zod, Valibot, ArkType, and others — can now be used, and the type of `entry.data` is inferred from it:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import * as v from 'valibot';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/blog' }),
  schema: v.object({
    title: v.string(),
    draft: v.optional(v.boolean(), false),
  }),
});

export const collections = { blog };
```

Existing Zod schemas keep working unchanged, including the `schema: (context) => ...` function form.

Data collections still get the `.schema.json` file that gives them autocompletion and validation in your editor, as long as the validator can also describe itself as [JSON Schema](https://standardschema.dev/json-schema). When it cannot, the file is skipped and Astro logs a warning naming the collection.
