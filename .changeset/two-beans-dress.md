---
'astro': minor
'@astrojs/image': patch
---

Add `build.assetsPrefix` option for CDN support. If set, all Astro-generated asset links will be prefixed with it. For example, setting it to `https://cdn.example.com` would generate `https://cdn.example.com/_astro/penguin.123456.png` links.

Also adds `import.meta.env.ASSETS_PREFIX` environment variable that can be used to manually create asset links not handled by Astro.
