---
'astro': minor
---

Deprecates `astro/zod`

Now that content collections and actions accept any [Standard Schema](https://standardschema.dev) validator, Astro no longer needs to re-export a copy of Zod. `import { z } from 'astro/zod'` and `import zod from 'astro/zod'` are deprecated and will be removed in a future major version, as are the already-deprecated `z` exports of `astro:schema` and `astro:content`.

Install `zod` as a dependency of your project and import from it directly:

```diff
- import { z } from 'astro/zod';
+ import { z } from 'zod';
```
