---
'@astrojs/mdx': patch
---

Fixes `.mdx` files ignoring `extendMarkdownConfig: false` for the Markdown processor ([#17030](https://github.com/withastro/astro/issues/17030)).

Previously, `.mdx` files always inherited your site's configured `markdown.processor` (and its plugins), even with `extendMarkdownConfig: false`. Now `extendMarkdownConfig: false` renders `.mdx` with a clean default Sätteri processor, matching the documented behaviour.

The deprecated `remarkPlugins`/`rehypePlugins`/`remarkRehype`/`recmaPlugins` options on `mdx({...})` continue to work: they are wired into the `unified` processor from `@astrojs/markdown-remark`, mirroring how `markdown.remarkPlugins` behaves in core. `recmaPlugins` on `mdx({...})` is now deprecated too — pass it to `unified({ recmaPlugins })` instead.
