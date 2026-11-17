---
'@astrojs/markdown-remark': patch
---

Fixes `getHeadings()` and `render().headings` reporting `{` as `${` in Markdown heading text when using the `unified()` processor
