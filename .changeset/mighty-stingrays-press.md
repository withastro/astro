---
'astro': patch
---

Adds support for Zod discriminated unions on Action form inputs. This allows forms with different inputs to be submitted to the same action, using a given input to decide which object should be used for validation.

This example accepts either a `create` or `update` form submission, and uses the `type` field to determine which object to validate against.

```ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  changeUser: defineAction({
    accept: 'form',
    input: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('create'),
        name: z.string(),
        email: z.string().email(),
      }),
      z.object({
        type: z.literal('update'),
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      }),
    ]),
    async handler(input) {
      if (input.type === 'create') {
        // input is { type: 'create', name: string, email: string }
      } else {
        // input is { type: 'update', id: number, name: string, email: string }
      }
    },
  }),
}
```

The corresponding `create` and `update` forms may look like this:

```astro
---
import { actions } from 'astro:actions';
---

<!--Create-->
<form action={actions.changeUser} method="POST">
  <input type="hidden" name="type" value="create" />
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <button type="submit">Create User</button>
</form>

<!--Update-->
<form action={actions.changeUser} method="POST">
  <input type="hidden" name="type" value="update" />
  <input type="hidden" name="id" value="user-123" />
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <button type="submit">Update User</button>
</form>
```
