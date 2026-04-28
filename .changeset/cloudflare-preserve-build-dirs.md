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

This release also includes several related fixes:

- Fixes preview for static sites that contain non-prerendered routes. Previously, the preview command ignored SSR routes discovered during route scanning and always used the static preview server.
- Fixes the static preview server to respect `preserveBuildClientDir`, serving files from `build.client` instead of `outDir` when the adapter requires it.
- Skips the static preview server when an adapter provides its own `previewEntrypoint`, allowing the adapter to handle both static and dynamic routes.
- Exempts internal routes (e.g. server islands) from `getStaticPaths()` validation, fixing server island rendering on static sites.
