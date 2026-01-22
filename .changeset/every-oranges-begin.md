---
'@astrojs/markdown-remark': patch
---

Fixes an issue where the function `createShikiHighlighter` would always create a new Shiki highlighter instance. Now the function returns a cached version of the highlighter based on the Shiki options. This should improve the perfomance for sites that heavily rely on Shiki and code in their pages.
