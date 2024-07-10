---
'astro': patch
---

Expose new `ActionReturnType` utility from `astro:actions`. This infers the return type of an action by passing `typeof actions.name` as a type argument. This example defines a `like` action that returns `likes` as an object:

```ts
// actions/index.ts
import { defineAction } from 'astro:actions';

export const server = {
  like: defineAction({
    handler: () => {
      /* ... */
      return { likes: 42 }
    }
  })
}
```

In your client code, you can infer this handler return value with `ActionReturnType`:

```ts
// client.ts
import { actions, ActionReturnType } from 'astro:actions';

type LikesResult = ActionReturnType<typeof actions.like>;
// -> { likes: number }
```
