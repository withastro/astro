---
'@astrojs/mdx': major
---

`.mdx` files are now rendered by your Markdown processor

`@astrojs/mdx` no longer carries its own MDX pipeline. `.mdx` files are compiled by whichever processor you set as `markdown.processor`, so plugins configured on that processor now apply to `.mdx` as well.

**Update your Markdown processor package.** MDX support requires `@astrojs/markdown-satteri` 0.4.0 or later, or `@astrojs/markdown-remark` 7.3.0 or later, and `astro` 7.2.6 or later. If either processor package appears in your own `package.json`, update it — a `^0.3.x` or `^7.2.x` range will not move on its own:

```
npm install @astrojs/markdown-satteri@latest
```

**`extendMarkdownConfig: false` now also applies to the processor.** Previously `.mdx` still used `markdown.processor` even with this set ([#17030](https://github.com/withastro/astro/issues/17030)). It now uses a clean default processor, as documented. To keep using a specific processor, pass it explicitly with `mdx({ extendMarkdownConfig: false, processor: myProcessor })`.

**The deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` and `remarkRehype` options on `mdx({...})` are ignored when your processor does not run them.** They only ever applied to `unified`, and they are never allowed to replace a processor you configured. You get a warning when they are skipped. Move them to `unified({...})` and set it as `markdown.processor` so `.mdx` inherits them.

`recmaPlugins` is now available as an option on `unified({ recmaPlugins })`.
