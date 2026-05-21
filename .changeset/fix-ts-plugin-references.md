---
'@astrojs/ts-plugin': patch
---

Fixes "Go To References" not finding usages in `.astro` files when members are accessed through `Astro.locals` or imported in `<script>` tags.

The ts-plugin now injects `astro/env.d.ts` and `astro/astro-jsx.d.ts` into the TypeScript program so that the `Astro` global type is available in virtual `.astro` files. This allows TypeScript to resolve type chains like `Astro.locals.utils.toUpper()` back to their definitions, enabling cross-file reference discovery.

Additionally, the ts-plugin now passes `includeScripts: false` to the Astro compiler's `convertToTSX`, preventing `<script>` tag content from being wrapped in arrow functions that make `import` declarations syntactically invalid.
