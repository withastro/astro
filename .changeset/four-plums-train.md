---
'astro': patch
'@astrojs/markdown-support': patch
---

Fix parsing of an empty `<pre></pre>` tag in markdown files, which expected the pre tag to have a child
