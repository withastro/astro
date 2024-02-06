---
"astro": minor
---

Adds a new `typescript` configuration option

A new `typescript` configuration option has been added to the Astro config:

```ts
import { defineConfig } from "astro/config"

export default defineConfig({
    // ...
    typescript: {
        include: [],
        exclude: [],
        files: [],
        excludeDefaults: true
    }
})
```

`include`, `exclude` and `files` must now be used instead of inside your `tsconfig.json`:

```diff
{
    "extends": "astro/tsconfigs/base",
    "compilerOptions": {},
-    "include": ["a"],
-    "exclude": ["b"],
-    "files": ["c"]
}
```

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
    // ...
    typescript: {
+        include: ["a"],
+        exclude: ["b"],
+        files: ["c"],
    }
})
```

Note that those fields will be `merged` until Astro 5, but we recommend you make the change.

This will allow to solve a long standing issue with `@astrojs/check` wrongly checking `outDir`
and `publicDir`. If you still want them to be checked, or handle this manually, set `excludeDefaults`
to `false`.
