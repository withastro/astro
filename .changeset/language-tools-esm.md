---
'@astrojs/ts-plugin': major
'@astrojs/yaml2ts': minor
'@astrojs/language-server': patch
'@astrojs/check': patch
'astro-vscode': patch
---

Migrates language tools and the VS Code extension to ES modules. Standalone language tools require Node.js `^20.19.0 || >=22.12.0`, including the Node.js process hosting the TypeScript plugin. The plugin preserves its synchronous factory export for compatible CommonJS hosts.
