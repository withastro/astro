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

Existing Zod schemas keep working unchanged. Validators that also describe themselves as JSON Schema continue to generate the `.schema.json` files used for editor autocompletion in data collections; validators that do not simply skip that step.
