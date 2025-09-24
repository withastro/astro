---
"@astrojs/react": minor
---

Stabilizes the formerly experimental `getActionState()` and `withState()` functions introduced in `@astrojs/react` v3.4.0 used to integrate Astro Actions with [React 19's `useActionState()` hook](https://react.dev/reference/react/useActionState).

(something hype here would be nice!)

This example calls a `like` action that accepts a `postId` and returns the number of likes. Pass this action to the `withState()` function to apply progressive enhancement info, and apply to `useActionState()` to track the result:

```
import { actions } from 'astro:actions';
import { withState } from '@astrojs/react/actions';
import { useActionState } from 'react';

export function Like({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(
    withState(actions.like),
    0, // initial likes
  );

  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <button disabled={pending}>{state} ❤️</button>
    </form>
  );
}
```

You can also access the state stored by `useActionState()` from your action handler. Call `getActionState()` with the API context, and optionally apply a type to the result:

```
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getActionState } from '@astrojs/react/actions';

export const server = {
  like: defineAction({
    input: z.object({
      postId: z.string(),
    }),
    handler: async ({ postId }, ctx) => {
      const currentLikes = getActionState<number>(ctx);
      // write to database
      return currentLikes + 1;
    },
  }),
};
```

If you were previously using this experimental feature, you will need to update your code to use the new stable exports:

```diff
// src/components/Form.jsx
import { actions } from 'astro:actions';
-import { experimental_withState } from '@astrojs/react/actions';
+import { withState } from '@astrojs/react/actions';
import { useActionState } from "react";
```

```diff
// src/actions/index.ts
import { defineAction, type SafeResult } from 'astro:actions';
import { z } from 'astro:schema';
-import { experimental_getActionState } from '@astrojs/react/actions';
+import { getActionState } from '@astrojs/react/actions';
```
