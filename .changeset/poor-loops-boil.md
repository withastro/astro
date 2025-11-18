---
'astro': minor
---

Adds the `ActionInputSchema` utility type to automatically determine the TypeScript type of an action's input based on its Zod schema

For example, this type can be used to retrieve the input type of a form action:

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
