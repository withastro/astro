---
'@astrojs/react': minor
'@astrojs/preact': minor
'@astrojs/svelte': minor
'@astrojs/solid-js': minor
'@astrojs/vue': minor
'@astrojs/mdx': minor
---

Replaces the import entrypoint of `getContainerRenderer()`

A new `container-renderer` entrypoint exporting `getContainerRenderer()` has been added to the following integrations: React, Preact, Svelte, SolidJS, Vue, and MDX. This prevents bundlers from trying to bundle unrelated exports from the package root when only the Container API is used.

If you are using the Container API, update your import statements to use the new entrypoint. The following example updates the `getContainerRenderer()` import for React:

```diff
- import { getContainerRenderer } from '@astrojs/react';
+ import { getContainerRenderer } from '@astrojs/react/container-renderer';
```

Importing `getContainerRenderer()` from the package root still works, but is now deprecated and logs a warning.
