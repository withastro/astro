---
'@astrojs/language-server': patch
'astro-vscode': patch
---

Updates Volar services to 0.0.70. This updates notably mean that the transitive dependency yaml-language-server no longer depends on a vulnerable version of lodash, causing warnings to show when installing the language server.
