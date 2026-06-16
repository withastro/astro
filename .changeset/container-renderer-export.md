---
'@astrojs/react': minor
'@astrojs/preact': minor
'@astrojs/svelte': minor
'@astrojs/solid-js': minor
'@astrojs/vue': minor
'@astrojs/mdx': minor
---

Adds a new `container-renderer` entrypoint for use with the Container API

When rendering components with the Container API, import `getContainerRenderer` from this new entrypoint instead of from the package root:

```diff
- import { getContainerRenderer } from '@astrojs/react';
+ import { getContainerRenderer } from '@astrojs/react/container-renderer';
```

This change was done in order to avoid bundlers trying to bundle unrelated exports from the package root when only the Container API is being used.

Importing `getContainerRenderer` from the package root still works, but is now deprecated and logs a warning.
