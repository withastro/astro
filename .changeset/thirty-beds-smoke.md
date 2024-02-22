---
"@astrojs/mdx": minor
"@astrojs/markdown-remark": minor
---

Handle syntax highlighting using rehype plugins instead of remark plugins. This provides better interoperability with other [rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md#list-of-plugins) that deal with code blocks, in particular with third party syntax highlighting plugins and [`rehype-mermaid`](https://github.com/remcohaszing/rehype-mermaid).

This may break your code if you are using either a remark plugin that relies on nodes of type `html`, or a rehype plugin that depends on nodes of type `raw`. If you are, you should consider using a rehype plugin that deals with the generated `element` nodes instead. You can use [`hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html) to get a string from a `raw` node, but better is to transform the AST instead of raw HTML strings.
