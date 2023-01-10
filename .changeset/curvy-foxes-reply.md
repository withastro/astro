---
'astro': minor
---

Move generated content collection types to a `.astro` directory. This replaces the previously generated `src/content/types.generated.d.ts` file.

If you're using Git for version control, we recommend ignoring this generated directory by adding `.astro` to your .gitignore.

Astro will also generate the [TypeScript reference path](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-path-) to include `.astro` types in your project. This will update your project's `src/env.d.ts` file, or write one if none exists.
