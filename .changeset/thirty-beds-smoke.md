---
"@astrojs/mdx": minor
"@astrojs/markdown-remark": minor
---

Changes Astro's internal syntax highlighting to use rehype plugins instead of remark plugins. This provides better interoperability with other [rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md#list-of-plugins) that deal with code blocks, in particular with third party syntax highlighting plugins and [`rehype-mermaid`](https://github.com/remcohaszing/rehype-mermaid).

This may be a breaking change if you are currently using:
- a remark plugin that relies on nodes of type `html`
- a rehype plugin that depends on nodes of type `raw`. 

Please review your rendered code samples carefully, and if necessary, consider using a rehype plugin that deals with the generated `element` nodes instead. You can transform the AST of raw HTML strings, or alternatively use [`hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html) to get a string from a `raw` node.
