---
"@astrojs/language-server": patch
"astro-vscode": patch
"@astrojs/check": patch
---

Fixes an issue where errors inside script and style tags could be offset by a few characters when multi bytes characters were present in the file
