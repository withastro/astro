---
'astro': minor
---

Deprecates the `input` schema of form actions

Passing `input` to an action with `accept: 'form'` still works with Zod, but support will be removed in Astro 8. Omit `input` to receive the submitted `FormData` in your handler. You can then choose how to convert fields and report validation errors.

For example, use `parseFormData()` from [`@standard-community/standard-form`](https://github.com/standard-community/standard-form) to convert the submitted fields and validate them with your schema:

```diff
- import { defineAction } from 'astro:actions';
+ import { parseFormData } from '@standard-community/standard-form';
+ import { ActionInputError, defineAction } from 'astro:actions';
  import { z } from 'astro/zod';

  const schema = z.object({ comment: z.string() });

  export const server = {
    comment: defineAction({
      accept: 'form',
-     input: schema,
-     handler: async ({ comment }) => {
+     handler: async (formData) => {
+       const result = await parseFormData(schema, formData);
+       if (result.issues) {
+         throw new ActionInputError(result.issues);
+       }
+       const { comment } = result.value;
        // ...
      },
    }),
  };
```
