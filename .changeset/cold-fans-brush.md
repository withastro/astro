---
'astro': minor
---

Adds support for [Standard Schema](https://standardschema.dev/) validators in the `input` of JSON actions

JSON actions previously required a Zod schema for `input`. You can keep your Zod schema or now use another Standard Schema validator. Astro passes the parsed output to the handler and returns an `ActionInputError` without calling the handler if validation fails.

For example, use Valibot to validate a greeting:

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import * as v from 'valibot';

export const server = {
  getGreeting: defineAction({
    input: v.object({ name: v.string() }),
    handler: ({ name }) => `Hello, ${name}!`,
  }),
};
```
