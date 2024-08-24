---
'astro': minor
---

Adds a new `experimental.typescript` configuration option

If you enable this option, Astro will generate a `tsconfig.json` file under `./.astro/`:

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
+    experimental: {
+        typescript: {}
+    }
})
```

It will create references under the hood, making `env.d.ts` optional if you haven't made any change to it:

```diff
-/// <reference types="astro/client" />
-/// <reference path="../.astro/types.d.ts" />
```

Enabling this option will require a few updates to your root `tsconfig.json`:

1. You'll need to make sure `extends` points to `./.astro/tsconfig.json`. If it's not correctly set, an eror will be thrown with a diff to help you
2. If you have `include` or `exclude`, you'll have to move them to respectively `experimental.typescript.include` and `experimental.typescript.exclude`:

```diff
{
-    "include": ["foo"],
-    "exclude": ["bar"]
}
```

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
    experimental: {
        typescript: {
+            include: ["foo"],
+            exclude: ["bar"]
        }
    }
})
```

By default, `outDir` will now be excluded to avoid a long standing issue when using `astro check` on an already built project. If you want to opt-out of this behavior, you can set `experimental.typescript.excludeOutDir` to `false`:

```diff
import { defineConfig } from "astro/config"

export default defineConfig({
    experimental: {
        typescript: {
+            excludeOutDir: false
        }
    }
})
```

To learn more, check out the [documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentaltypescript).