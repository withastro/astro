---
'astro': major
---

Removes `rewrite()` from Actions context

In Astro 5.5.6, the `ActionAPIContext.rewrite` method was deprecated because custom endpoints should be used instead of rewrites.

Astro 6.0 removes the `rewrite()` method from `ActionAPIContext` entirely and it may no longer be used.

#### What should I do?

Review your Actions handlers and remove any call to `rewrite()`:


```diff
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  getGreeting: defineAction({
    input: z.object({
      // ...
    }),
    handler: async (input, context) => {
-      context.rewrite('/')
      // ...
    }
  })
}
```
