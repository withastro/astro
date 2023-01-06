---
'astro': minor
---

Move generated content collection types to a `.astro` directory. This replaces the previously generated `src/content/types.generated.d.ts` file.

If you're using Git for version control, we recommend ignoring this generated directory by adding `.astro` to your .gitignore.

#### Migration

You will need a [TypeScript reference path](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) to include `.astro` types in your project. Running `astro dev`, `astro build`, or `astro sync` will configure this automatically if your project has a `src/env.d.ts` file. Otherwise, you can add a `src/env.d.ts` file manually with the following contents:

```diff
/// <reference path="astro/client" />
+ /// <reference types="../.astro/types.d.ts" />
```
