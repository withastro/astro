---
'astro': minor
---

Adds support for [Standard Schema](https://standardschema.dev/) validators in build-time and live content collections

Pass a schema directly to `defineCollection()` or `defineLiveCollection()` to validate entries and infer the type of `entry.data` from the parsed output. For example, use Valibot to define a blog collection:

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

A build-time loader can also provide a default validator with `schema` or return one from `createSchema()`. A schema in the collection config takes precedence. Existing Zod schemas from `astro/zod` keep working.

To get a `.schema.json` file for editor autocompletion, use a validator that also implements [Standard JSON Schema](https://standardschema.dev/json-schema). Otherwise, Astro warns and skips that file. Entry validation and TypeScript inference still work.
