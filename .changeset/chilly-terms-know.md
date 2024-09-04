---
'astro': major
---

Updates how the `build.client` and `build.server` option values get resolved. As currently documented, the option values will now correctly resolve relative to the `outDir` option. So if `outDir` is set to `./dist/nested/`, then by default:

- `build.client` will resolve to `<root>/dist/nested/client`
- `build.server` will resolve to `<root>/dist/nested/server`

Previously the values were incorrectly resolved:

- `build.client` was resolved to `<root>/dist/nested/dist/client`
- `build.server` was resolved to `<root>/dist/nested/dist/server`

If you were relying on the previous build paths, make sure that it's adapted to the new build paths.
