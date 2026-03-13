---
'astro': minor
---

Adds Standard Schema support and a `transform` option to content collections.

Content collection `schema` now accepts any [Standard Schema](https://standardschema.dev/)-compliant library (Zod, Valibot, ArkType, etc.) directly, in addition to the existing function-based `schema: ({ image }) => z.object({...})` form which continues to work unchanged.

A new optional `transform` option runs after schema validation and receives the validated data plus a context object with an `image` helper for resolving image paths. The top-level `reference()` export gains a two-argument form for use inside `transform`.

```ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import * as v from 'valibot';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  // Standard Schema — validates raw frontmatter; image paths are plain strings
  schema: v.object({
    title: v.string(),
    heroImage: v.string(),
    author: v.string(),
  }),
  // Optional: transform runs after validation with Astro-provided helpers
  transform: async (data, { image }) => ({
    ...data,
    heroImage: await image(data.heroImage),
    author: reference('authors', data.author),
  }),
});
```

**New `reference(collection, id)` overload**

The existing one-argument `reference('collection')` form (which returns a Zod schema for use inside function-based schemas) is unchanged. The new two-argument form returns `{ id, collection }` directly and is intended for use inside `transform`:

```ts
// OLD — still works, used inside function-based schema
schema: ({ image }) => z.object({ author: reference('authors') })

// NEW — used inside transform
transform: (data) => ({ ...data, author: reference('authors', data.author) })
```
