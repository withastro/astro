---
'astro': minor
---

Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities when using Astro Actions.

## Migration for Astro Actions users

`z` will no longer be exposed from `astro:actions`. To use `z` in your actions, import it from `astro:schema` instead:

```diff
import {
  defineAction,
-  z,
} from 'astro:actions';
+ import { z } from 'astro:schema';
```
