---
'create-astro': minor
---

Reworks the experience of creating a new Astro project using the `create astro` CLI command.

- Updates the list of templates to include Starlight and combines the "minimal" and "basics" templates into a new, refreshed "Basics" template to serve as the single, minimal Astro project starter.
- Removes the TypeScript question. Astro is TypeScript-only, so this question was often misleading. The "Strict" preset is now the default, but it can still be changed manually in `tsconfig.json`. 
- `astro check` is no longer automatically added to the build script.
- Adds a new question allowing the user to choose an adapter for their project, if they already know where they want to deploy it.

