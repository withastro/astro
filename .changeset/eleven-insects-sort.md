---
'astro': minor
---

Deprecates `astro/zod`

Now that content collections and actions accept any [Standard Schema](https://standardschema.dev) validator, Astro no longer needs to re-export a copy of Zod. `import { z } from 'astro/zod'` and `import zod from 'astro/zod'` are deprecated and will be removed in Astro 8, as is the already-deprecated `astro:schema` module.

Install `zod` as a dependency of your project and import from it directly:

```diff
- import { z } from 'astro/zod';
+ import { z } from 'zod';
```
