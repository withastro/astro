---
'@astrojs/markdown-remark': minor
---

Refactor and export `rehypeHeadingIds` plugin

The `rehypeHeadingIds` plugin injects IDs for all headings in a Markdown document and can now also handle MDX inputs if needed. You can import and use this plugin if you need heading IDs to be injected _before_ other rehype plugins run.
