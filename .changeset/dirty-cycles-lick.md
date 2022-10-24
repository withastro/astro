---
'astro': minor
---

Add `astro/types` entrypoint. These utilities can be used for common prop type patterns.

## `HTMLAttributes`

If you would like to extend valid HTML attributes for a given HTML element, you may use the provided `HTMLAttributes` type—it accepts an element name and returns the valid HTML attributes for that element name.

```ts
import { HTMLAttributes } from 'astro/types';
interface Props extends HTMLAttributes<'a'> {
  myProp?: string;
};
```
