---
'@astrojs/markdown-remark': minor
'@astrojs/markdown-satteri': minor
---

The `unified()` and `satteri()` Markdown processors now render `.mdx` files themselves, so `.mdx` files follow whichever processor you configure, plugins included.

`unified()` also gains a `recmaPlugins` option for adding recma (estree/JSX) plugins to the MDX compiler.
