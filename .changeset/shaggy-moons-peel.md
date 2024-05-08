---
"astro": minor
---

Adds experimental support for the Actions API. Actions let you define type-safe endpoints you can query from client components with progressive enhancement built in.


Actions help you write type-safe backend functions you can call from anywhere. Enable server rendering [using the `output` property](https://docs.astro.build/en/basics/rendering-modes/#on-demand-rendered) and add the `actions` flag to the `experimental` object:
	 
```js
{
  output: 'hybrid', // or 'server'
  experimental: {
    actions: true,
  },
}
```
	 
Declare all your actions in `src/actions/index.ts`. This file is the global actions handler.
	 
Define an action using the `defineAction()` utility from the `astro:actions` module. These accept the `handler` property to define your server-side request handler. If your action accepts arguments, apply the `input` property to validate parameters with Zod.
	 
This example defines two actions: `like` and `comment`. The `like` action accepts a JSON object with a `postId` string, while the `comment` action accepts [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) with `postId`, `author`, and `body` strings. Each `handler` updates your database and return a type-safe response.
	 
```ts
// src/actions/index.ts
import { defineAction, z } from "astro:actions";
	 
export const server = {
  like: defineAction({
    input: z.object({ postId: z.string() }),
    handler: async ({ postId }, context) => {
      // update likes in db
	 
      return likes;
    },
  }),
  comment: defineAction({
    accept: 'form',
    input: z.object({
      postId: z.string(),
      author: z.string(),
      body: z.string(),
    }),
    handler: async ({ postId }, context) => {
      // insert comments in db

      return comment;
    },
  }),
};
```
	 
Then, call an action from your client components using the `actions` object from `astro:actions`. You can pass a type-safe object when using JSON, or a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects) object when using `accept: 'form'` in your action definition:
	 
```tsx "actions"
// src/components/blog.tsx
import { actions } from "astro:actions";
import { useState } from "preact/hooks";
	 
export function Like({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(0);
  return (
    <button
      onClick={async () => {
        const newLikes = await actions.like({ postId });
        setLikes(newLikes);
      }}
    >
      {likes} likes
    </button>
  );
}
	 
export function Comment({ postId }: { postId: string }) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await actions.blog.comment(formData);
        // handle result
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <label for="author">Author</label>
      <input id="author" type="text" name="author" />
      <textarea rows={10} name="body"></textarea>
      <button type="submit">Post</button>
    </form>
  );
}
```
	 
For a complete overview, and to give feedback on this experimental API, see the [Actions RFC](https://github.com/withastro/roadmap/blob/actions/proposals/0046-actions.md).
