---
'astro': patch
---

Expands the `isInputError()` utility from `astro:actions` to accept errors of any type. This should now allow type narrowing from a try / catch block.

```ts
// example.ts
import { actions, isInputError } from 'astro:actions';

try {
  await actions.like(new FormData());
} catch (error) {
  if (isInputError(error)) {
    console.log(error.fields);
  }
}
```
