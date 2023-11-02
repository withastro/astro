---
'@astrojs/language-server': patch
'@astrojs/ts-plugin': patch
'astro-vscode': patch
'@astrojs/check': patch
---

Automatically flatten inferred unions from `getStaticPaths` into each other so that divergent props don't need to be manually discriminated before destructuring.
