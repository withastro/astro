---
'astro': patch
---

Ensure `InferGetStaticParamsType` correctly infers route parameters as strings.

This change aligns the **static type** of `Astro.params` with its **runtime behavior**, where all route parameters are converted to strings. Previously, numeric values in `getStaticPaths` were inferred as `number`, causing a type mismatch.

```ts
---
// src/pages/post/[id].astro
import type { GetStaticPaths, InferGetStaticParamsType } from 'astro';

export const getStaticPaths = (() => {
    return [
        { params: { id: 1 } },
        { params: { id: 2 } },
    ];
}) satisfies GetStaticPaths;

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
//   ^?
//   Previously: { id: number }
//   Now:        { id: string }

const params = Astro.params as Params;
console.log(typeof params.id); // Always "string" at runtime.
---
```
