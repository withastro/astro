---
'astro': minor
---

Move Content Collections config and generated types to the project root.

## Migration

Move your config from `src/content/config.ts` to a `content.config.ts` file at the base of your project.

If you've added `types.generated.d.ts` to your `gitignore`, ensure this is pointing to your project root instead of `src/content/types.generated.d.ts`.
