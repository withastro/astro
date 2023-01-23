---
'astro': major
---

Replace the content collection `slug()` config with a new `slug` frontmatter field.

This introduces a reserved `slug` property you can add to any Markdown or MDX collection entry. When present, this will override the generated slug for that entry.

```diff
# src/content/blog/post-1.md
---
title: Post 1
+ slug: post-1-custom-slug
---
```

Astro will respect this slug in the generated `slug` type and when using the `getEntryBySlug()` utility:

```astro
---
import { getEntryBySlug } from 'astro:content';

// Retrieve `src/content/blog/post-1.md` by slug with type safety
const post = await getEntryBySlug('blog', 'post-1-custom-slug');
---
```

#### Migration

If you relied on the `slug()` config option, we suggest moving all custom slugs to `slug` frontmatter properties in each collection entry.

Additionally, Astro no longer allows `slug` as a collection schema property. This ensures Astro can manage the `slug` property for type generation and performance. Remove this property from your schema and any relevant `slug()` configuration:

```diff
const blog = defineCollection({
  schema: z.object({
-   slug: z.string().optional(),
  }),
- slug({ defaultSlug, data }) {
-   return data.slug ?? defaultSlug;
- },
})
```
