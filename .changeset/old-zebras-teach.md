---
'astro': major
---

Updates `astro sync` behavior

`astro sync` will no longer create nor update `src/env.dts`. You can keep using it but we recommend you update your root `tsconfig.json` instead:

```diff
{
    "extends": "astro/tsconfigs/base",
+    "include": ["**/*", ".astro/types.d.ts"],
+    "exclude": ["dist"]
}
```