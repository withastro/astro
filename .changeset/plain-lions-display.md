---
'@astrojs/prism': patch
'@astrojs/markdoc': patch
'@astrojs/markdown-remark': patch
'@astrojs/markdown-satteri': patch
---

Fixes Prism code blocks for languages Prism doesn't support, such as `vue` or `svelte`. Their code is now displayed as plain text instead of being rendered as HTML. Also correctly escapes the code block language in the generated `class` and `data-language` attributes.
