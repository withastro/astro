---
'@astrojs/mdx': patch
---

Adds a warning when the deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` and `remarkRehype` options are ignored because your Markdown processor does not run them. They still apply when your processor is `unified()`, and were previously dropped silently otherwise.
