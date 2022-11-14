---
'@astrojs/ts-plugin': minor
'astro-vscode': minor
---

Improved support for `.astro` imports inside JavaScript/TypeScript files:
- Added support for finding file references inside Astro files
- Added support for path completions for .astro, .md and .mdx files
- Fixed cases where our TypeScript plugin would fail to load under certain circumstance
- Fixed certain cases where Go to definition / implementation would fail
