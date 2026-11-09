---
'@astrojs/ts-content-mapper': patch
'@astrojs/language-server': patch
'@astrojs/ts-plugin': patch
'astro-vscode': patch
---

Fixes `astro check` and editor language tools failing to start when pnpm resolves an incompatible WASM runtime.
