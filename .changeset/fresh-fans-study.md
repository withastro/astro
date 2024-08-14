---
'@astrojs/db': minor
---

Changes how type generation works

The generated `.d.ts` file is now at a new location:

```diff
- .astro/db-types.d.ts
+ .astro/integrations/astro_db/db.d.ts
```

The following line can now be removed from `src/env.d.ts`:

```diff
- /// <reference path="../.astro/db-types.d.ts" />
```
