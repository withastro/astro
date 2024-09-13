---
'astro': major
---

Adds a default exclude and include value to the tsconfig presets. `{projectDir}/dist` is now excluded by default, and `{projectDir}/.astro/types.d.ts` and `{projectDir}/**/*` are included by default.

Both of these options can be overridden by setting your own values to the corresponding settings in your `tsconfig.json` file.
