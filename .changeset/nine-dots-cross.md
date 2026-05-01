---
'@astrojs/svelte': patch
---

Fixes a type mismatch issue where Svelte 5 components were incorrectly flagged as incompatible with testing libraries (e.g. `@testing-library/svelte`) during astro check. This fix ensures that Svelte 5 components pass validation in unit tests while preserving support for Astro's `client:* directives` in `.astro` files.
