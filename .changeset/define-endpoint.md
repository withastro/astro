---
"astro": minor
---

Adds a new `defineEndpoint()` helper to improve [Endpoint](https://docs.astro.build/en/guides/endpoints/) ergonomics.

```ts
import { defineEndpoint } from 'astro:endpoint';

export const GET = defineEndpoint((context) => Response.json({ message: "Hello!" }));
```
