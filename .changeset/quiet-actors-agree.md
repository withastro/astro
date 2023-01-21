---
'astro': minor
---

Allow Zod objects, unions, discriminated unions, intersections, and transform results as content collection schemas.

#### Migration

Astro requires a `z.object(...)` wrapper on all content collection schemas. Update your content collections config like so:

```diff
// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const blog = defineCollection({
- schema: {
+ schema: z.object({
  ...
})
```
