---
'@astrojs/language-server': patch
---

Fixes `astro check` silently skipping `.astro` files inside tsconfig project references.

`@volar/kit`'s checker re-parses the root tsconfig with the language plugins' `extraFileExtensions` (so `.astro` files are included), but reused TypeScript's own resolved `commandLine` for project references, which never includes extra extensions — so `.astro` files reachable only through a referenced tsconfig were silently skipped.

This is fixed in `AstroCheck` (`packages/language-tools/language-server/src/check.ts`), by re-parsing each referenced project's tsconfig the same way the root one already is and merging the result into that project's file list. This does not touch the editor's language server path (`nodeServer.ts`/`createTypeScriptProject`), which is separate.
