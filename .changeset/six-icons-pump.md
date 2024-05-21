---
"astro": minor
---

Deprecate the `getApiContext()` function. API Context can now be accessed from the second parameter to your Action `handler()`:

```diff
// src/actions/index.ts
import {
  defineAction,
  z,
-  getApiContext,
} from 'astro:actions';

export const server = {
  login: defineAction({
    input: z.object({ id: z.string }),
+    handler(input, apiContext) {
      const user = apiContext.locals.auth(input.id);
      return user;
    }
  }),
}
```
