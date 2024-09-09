---
'astro': major
---

Changes the default `tsconfig.json` with better defaults, and makes `src/env.d.ts`  optional

Astro's default `tsconfig.json` in starter examples has been updated to include generated types and exclude your build output. This means that `src/env.d.ts` is only necessary if you have added custom type declarations or if you're not using a `tsconfig.json` file.

Additionally, running `astro sync` no longer creates, nor updates, `src/env.d.ts` as it is not required for type-checking standard Astro projects.

To update your project to Astro's recommended TypeScript settings, please add the following `include` and `exclude` properties to `tsconfig.json`:

```diff
{
    "extends": "astro/tsconfigs/base",
+    "include": [".astro/types.d.ts", "**/*"],
+    "exclude": ["dist"]
}
```