---
'astro': minor
---

Deprecates the `input` schema for form actions

Passing `input` to an action with `accept: 'form'` is deprecated and will be removed in Astro 8. Astro's `FormData` coercion is too opinionated to fit every form, and unlike JSON actions it can only ever support Zod.

Parse the `FormData` in your handler instead, using [`@standard-community/standard-form`](https://github.com/standard-community/standard-form). It does the same job with the validator of your choice, and you stay in control of how the result is coerced and how errors are reported:

```diff
+ import { parseFormData } from '@standard-community/standard-form';
  import { ActionError, defineAction } from 'astro:actions';
  import { z } from 'zod';

  const schema = z.object({ comment: z.string() });
 
  export const server = {
    comment: defineAction({
      accept: 'form',
-     input: schema,
-     handler: async ({ comment }) => {
+     handler: async (formData) => {
+       const { value, issues } = await parseFormData(schema, formData);
+       if (issues) {
+         throw new ActionError({ code: 'BAD_REQUEST', message: issues[0].message });
+       }
        // ...
      },
    }),
  };
```
