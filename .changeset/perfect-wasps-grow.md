---
'astro': minor
---

Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities when using Astro Actions.

`z` is still available to import from `astro:content` when using Content Collections. In the next major release, we will deprecate this import in favor of using `astro:schema` as well.

## Migration for Astro Actions users

`z` will no longer be exposed from `astro:actions`. To use `z` in your actions, import it from `astro:schema` instead:

```diff
import {
  defineAction,
-  z,
} from 'astro:actions';
+ import { z } from 'astro:schema';
```
