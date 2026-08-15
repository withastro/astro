---
'@astrojs/language-server': patch
---

Fixes `astro check` (and the editor language server) silently skipping `.astro` files inside tsconfig project references. `@volar/kit` is patched via pnpm's `patchedDependencies` so referenced tsconfigs are re-parsed with the language plugins' `extraFileExtensions`, matching how the root tsconfig is already parsed.
