---
'astro': minor
---

Adds a new `preserveBuildServerDir` adapter feature

Adapters can now set `preserveBuildServerDir: true` in their adapter features to keep the `dist/server/` directory structure for static builds, mirroring the existing `preserveBuildClientDir` option. This is useful for adapters that require a consistent `dist/client/` and `dist/server/` layout regardless of build output type.

```js
setAdapter({
  name: 'my-adapter',
  adapterFeatures: {
    buildOutput,
    preserveBuildClientDir: true,
    preserveBuildServerDir: true,
  },
});
```
