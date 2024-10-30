---
'create-astro': minor
---

Rework the experience of creating a new Astro project.

- Update the list of templates to include Starlight and remove the minimal template.
- Removed the TypeScript question. Astro is TypeScript-only, so this question was often misleading. The "Strict" preset is now the default, but it can still be changed manually in `tsconfig.json`. `astro check` is no longer automatically added to the build script.
- Added a new question allowing the user to choose an adapter for their project, if they already know where they want to deploy it.

Additionally, to support the removal of the minimal template as an option, this PR reworks the basics template to be more minimal, moving most of its implementation into Astro directly. This makes the Basics template now a mix between the old Basics and Minimal templates.
