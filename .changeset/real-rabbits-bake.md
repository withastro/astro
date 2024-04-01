---
"@astrojs/markdown-remark": major
---

Updates Shiki syntax highlighting to lazily load shiki languages by default (only preloading `plaintext`). Additionally, the `createShikiHighlighter()` API now returns an asynchronous `highlight()` function due to this.
