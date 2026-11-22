---
'@astrojs/markdown-satteri': patch
---

Fixes text after a colon (e.g. `12:30`, `16:9`, `key:value`) disappearing when `features.directive` is enabled. Text directives that no plugin handles are now kept as plain text
