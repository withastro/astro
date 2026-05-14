---
'astro': patch
---

Adds `Fetchable` type export for typing the advanced routing entrypoint

```ts
import type { Fetchable } from 'astro';

export default {
  async fetch(request) {
    return new Response('ok');
  },
} satisfies Fetchable;
```
