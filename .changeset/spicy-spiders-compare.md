---
"@astrojs/react": minor
---

Stabilizes the `getActonState()` and `withState()` functions used to integrate Astro Actions with [React 19's `useActionState()` hook](https://react.dev/reference/react/useActionState).

You will need to update your code to use the new stable exports:

```diff
import { actions } from 'astro:actions';
-import { experimental_withState } from '@astrojs/react/actions';
+import { withState } from '@astrojs/react/actions';
import { useActionState } from "react";

export function Like({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(
-   experimental_withState(actions.like),
+   withState(actions.like),
    { data: 0, error: undefined }, // initial likes and errors
  );

  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <button disabled={pending}>{state.data} ❤️</button>
    </form>
  );
}
```

```diff
import { defineAction, type SafeResult } from 'astro:actions';
import { z } from 'astro:schema';
-import { experimental_getActionState } from '@astrojs/react/actions';
+import { getActionState } from '@astrojs/react/actions';

export const server = {
  like: defineAction({
    accept: "form",
    input: z.object({
      postId: z.string(),
    }),
    handler: async ({ postId }, ctx) => {
-     const currentLikes = await experimental_getActionState<SafeResult<any, number>>(ctx);
-     const currentLikes = await getActionState<SafeResult<any, number>>(ctx);
      // write to database
      return (currentLikes.data ?? 0) + 1;
    },
  }),
};
```
