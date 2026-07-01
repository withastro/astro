---
'@astrojs/markdown-remark': minor
'@astrojs/markdown-satteri': minor
---

The `unified()` and `satteri()` Markdown processors now render `.mdx` files themselves, through a new optional `createMdxRenderer` hook on the processor. `.mdx` files follow whichever processor you configure, and third-party processors can add their own MDX support by implementing the hook.

`unified()` also gains a `recmaPlugins` option for adding recma (estree/JSX) plugins to the MDX compiler.
