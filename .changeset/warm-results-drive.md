---
'astro': patch
---

Fixes `astro check` failing to detect TypeScript 7 as installed. TypeScript 7 removed its default CJS export entry point, causing `require.resolve('typescript')` to throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. Astro now correctly recognizes packages that are installed but have no default export.
