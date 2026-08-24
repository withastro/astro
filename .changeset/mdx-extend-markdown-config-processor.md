---
'@astrojs/mdx': major
---

`.mdx` files are now rendered by the processor you set as `markdown.processor`, so its plugins apply to `.mdx` as well.

MDX support requires `@astrojs/markdown-satteri` 0.4.0 or later, or `@astrojs/markdown-remark` 7.3.0 or later. Update whichever one appears in your own `package.json` — a `^0.3.x` or `^7.2.x` range will not move on its own.

`extendMarkdownConfig: false` now also stops `.mdx` inheriting `markdown.processor`. Pass `mdx({ processor })` to choose one explicitly.

The deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` and `remarkRehype` options are ignored when your processor does not run them, and warn when skipped. Pass them to `unified({ ... })` instead.
