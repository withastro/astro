---
'astro': minor
---

Adds support for any [Standard Schema](https://standardschema.dev) validator in the `input` of JSON actions

The `input` of an action that accepts JSON, the default, is no longer required to be a Zod schema. Any validator implementing Standard Schema — Zod, Valibot, ArkType, and others — can now be used:

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import * as v from 'valibot';

export const server = {
  subscribe: defineAction({
    input: v.object({ channel: v.string() }),
    handler: async ({ channel }) => {
      // `channel` is typed as `string`
    },
  }),
};
```
