---
'@astrojs/language-server': patch
---

Fixes `astro check` (and the editor language server) silently skipping `.astro` files inside tsconfig project references.

`@volar/kit`'s checker re-parses the root tsconfig with the language plugins' `extraFileExtensions` (so `.astro` files are included), but reused TypeScript's own resolved `commandLine` for project references, which never includes extra extensions — so `.astro` files reachable only through a referenced tsconfig were silently skipped.

This is fixed directly in `@astrojs/language-server`'s own checker setup, by re-parsing each referenced project's tsconfig the same way the root one already is and merging the result into that project's file list. No change to the `@volar/kit` dependency itself, so the fix ships in the published `@astrojs/check`, `@astrojs/language-server`, and the editor extension alike.
