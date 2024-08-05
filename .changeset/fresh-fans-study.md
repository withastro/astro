---
'@astrojs/db': minor
---

Changes how typegen works

The generated dts file is now at a new location:

```diff
- .astro/db-types.d.ts
+ .astro/astro/db.d.ts
```

The update made to `src/env.d.ts` can be undone:

```diff
- /// <reference path="../.astro/db-types.d.ts" />
```
