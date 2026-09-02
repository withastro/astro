---
'astro': minor
---

Adds support for any [Standard Schema](https://standardschema.dev) validator in the `input` of JSON actions

Actions that accept JSON, the default, can now validate their payload with any validator implementing [Standard Schema](https://standardschema.dev) — Zod, Valibot, ArkType, and others — instead of only Zod. The handler receives its parsed output, typed by the validator:

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

Existing Zod schemas keep working unchanged.
