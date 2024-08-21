---
'astro': patch
---

Exposes `z` from the new `astro:schema` module. This is the new recommended import source for all Zod utilities in Astro. `z` will still be available to import from existing Astro modules (`astro:content` and `astro:actions`), but this will change in future releases:

- `z` will be **removed** from `astro:actions` in the next minor release.
- `z` will be **deprecated** in `astro:content` in the next major release.

## Migration for Astro Actions users

`z` will no longer be exposed from `astro:actions` in the next minor release. To use `z` in your actions, import it from `astro:schema` instead:

```diff
import {
  defineAction,
-  z,
} from 'astro:actions';
+ import { z } from 'astro:schema';
```
