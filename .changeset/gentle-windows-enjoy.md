---
"@astrojs/react": minor
"astro": minor
---

Adds two new functions `experimental_getActionState()` and `experimental_withState()` to support [the React 19 `useActionState()` hook](https://react.dev/reference/react/useActionState) when using Astro Actions. This introduces progressive enhancement when calling an Action with the `withState()` utility.

This example calls a `like` action that accepts a `postId` and returns the number of likes. Pass this action to the `experimental_withState()` function to apply progressive enhancement info, and apply to `useActionState()` to track the result:

```tsx
import { actions } from 'astro:actions';
import { experimental_withState } from '@astrojs/react/actions';

export function Like({ postId }: { postId: string }) {
	const [state, action, pending] = useActionState(
		experimental_withState(actions.like),
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

You can also access the state stored by `useActionState()` from your action `handler`. Call `experimental_getActionState()` with the API context, and optionally apply a type to the result:

```ts
import { defineAction, z } from 'astro:actions';
import { experimental_getActionState } from '@astrojs/react/actions';

export const server = {
  like: defineAction({
    input: z.object({
      postId: z.string(),
    }),
    handler: async ({ postId }, ctx) => {
      const currentLikes = experimental_getActionState<number>(ctx);
      // write to database
      return currentLikes + 1;
    }
  })
}
