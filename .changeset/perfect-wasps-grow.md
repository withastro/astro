---
'astro': patch
---

Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities in Astro. `z` is will still be available to import from `astro:actions` until version 4.15, and available from `astro:content` until our planned deprecation in the next major release. Note `z` will be the same regardless of where it is imported from.

## Migration for Astro Actions users

`z` will no longer be exposed from `astro:actions` in the next minor release. To use `z` in your actions, import it from `astro:schema` instead:

```diff
import {
  defineAction,
-  z,
} from 'astro:actions';
+ import { z } from 'astro:schema';
```
