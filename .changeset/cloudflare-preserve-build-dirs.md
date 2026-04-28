---
'astro': patch
---

Adds a `preserveBuildServerDir` adapter feature and fixes preview for static sites with SSR routes

Adds `preserveBuildServerDir` to `AstroAdapterFeatures`, mirroring the existing `preserveBuildClientDir` option. This allows adapters to keep the `dist/server/` directory structure even for static builds.

Also fixes several issues with the preview command:

- Fixes preview for static sites that contain non-prerendered routes (e.g. `/_image`). Previously, the preview command would override the build output detection and always use the static preview server based on the `output` config, ignoring SSR routes discovered during route scanning.
- Fixes the static preview server to respect `preserveBuildClientDir`, serving files from `build.client` instead of `outDir` when the adapter requires it.
- Skips the static preview server when an adapter provides its own `previewEntrypoint`, allowing the adapter to handle both static and dynamic routes.
- Exempts internal routes (e.g. server islands) from `getStaticPaths()` validation, fixing server island rendering on static sites without the `buildOutput` mutation.
