---
'astro': patch
'@astrojs/check': patch
---

Fixes `astro check` falsely reporting TypeScript as not installed when using TypeScript 7.

TypeScript 7 removed its default CJS entry point, causing `require.resolve('typescript')` to throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. The fix detects this error and falls back to resolving `typescript/package.json` to confirm the package is installed.
