---
"@astrojs/language-server": patch
"astro-vscode": patch
---

Fixes `.prettierignore` and `.editorconfig` not working correctly. This update also improves the error logging around Prettier, the LSP will now warn when it failed to load the Prettier config.
