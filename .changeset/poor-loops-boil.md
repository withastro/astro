---
'astro': minor
---

Adds the `ActionInputSchema` utility type to infer an action's input zod schema.

Example usage:

```ts
import { type ActionInputSchema, defineAction } from 'astro:actions';
import { z } from 'astro/zod';

const action = defineAction({
  accept: 'form',
  input: z.object({ name: z.string() }),
  handler: ({ name }) => ({ message: `Welcome, ${name}!` }),
});

type Schema = ActionInputSchema<typeof action>; 
// typeof z.object({ name: z.string() })

type Input = z.input<Schema>;
// { name: string }
```
