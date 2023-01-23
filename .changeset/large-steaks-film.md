---
'astro': major
---

Content collections: Introduce a new `slug` frontmatter field for overriding the generated slug. This replaces the previous `slug()` collection config option from Astro 1.X and the 2.0 beta.

When present in a Markdown or MDX file, this will override the generated slug for that entry.

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

If you relied on the `slug()` config option, you will need to move all custom slugs to `slug` frontmatter properties in each collection entry.

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
