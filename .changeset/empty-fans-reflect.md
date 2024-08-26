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

1. `extends` must point to `./.astro/tsconfig.json` otherwise an error will be thrown with a diff to help you.
2. If set, move `include` and `exclude` to `experimental.typescript.include` and `experimental.typescript.exclude` respectively in your Astro config file.

For example, in `tsconfig.json` you'll need to make the following changes:

```diff
{
+    "extends": "./.astro/tsconfig.json"
-    "include": ["foo"],
-    "exclude": ["bar"]
}
```

Then you'll need to reflect them in `astro.config.mjs`:

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