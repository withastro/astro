---
'@astrojs/language-server': patch
'astro-vscode': patch
---

Fix Astro formatting regression where trailing commas in multiline function parameters were removed by the language server by reverting to volar-service-prettier 0.0.67 and adding coverage to ensure trailingComma=all is respected.
