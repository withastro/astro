---
'@astrojs/svelte': minor
---

This change updates the Svelte integration's type shims to treat non-children
snippet props and `any`-typed props as optional. Previously, these were
incorrectly marked as required in Astro files, causing false-positive type
errors when using Svelte 5 components.

- Adds `HandleSnippetProps` to make Snippets optional in Astro.
- Distinguishes between generic and non-generic components to preserve inference.
- Updates TSX generation to apply the appropriate directive wrapper.
