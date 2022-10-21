---
'astro': minor
---

Add `astro/type-utils` entrypoint. These utilities can be used for common prop type patterns.

## `HTMLAttributes`

If you would like to extend valid HTML attributes for a given HTML element, you may use the provided `HTMLAttributes` type—it accepts an element name and returns the valid HTML attributes for that element name.

```ts
import { HTMLAttributes } from 'astro/type-utils';
interface Props extends HTMLAttributes<'a'> {
  myProp?: string;
};
```

## `NoProps`

If your component takes no props or slotted content, you can use the provided `NoProps` type.

```ts
import { NoProps } from 'astro/type-utils';
type Props = NoProps;
```

## `WithChildren`

If your component requires children passed to the default slot, you can extend the provided `WithChildren` type.

```ts
import { WithChildren } from 'astro/type-utils';
interface Props extends WithChildren {
  myProp?: string;
};
```
