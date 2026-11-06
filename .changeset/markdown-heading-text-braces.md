---
'@astrojs/markdown-remark': patch
---

Fixes the `text` of Markdown headings returned by `getHeadings()`, which turned each `{` into `${`, so a heading like `## Using {braces}` was listed as `Using ${braces}`
