---
'@astrojs/language-server': patch
---

Fixes a crash in the language server and `astro check` when using TypeScript project references with `.vue` or `.svelte` files. When a referenced project's tsconfig includes non-TS files, TypeScript's redirect map could create self-referencing entries that cause infinite recursion. The fix provides a `getParsedCommandLine` handler that filters non-TS extensions from referenced project file lists.
