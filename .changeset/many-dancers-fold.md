---
'astro': minor
---

Move `image()` to come from `schema` instead to fix it not working with refine and inside complex types

**Migration**:

Remove the `image` import from `astro:content`, and instead use a function to generate your schema, like such:

```ts
import { defineCollection, z } from "astro:content";

defineCollection({
  schema: ({ image }) =>
    z.object({
      image: image().refine((img) => img.width >= 200, {
        message: "image too small",
      }),
    }),
});
```
