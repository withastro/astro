---
'astro': patch
---

If you have `@astrojs/markdown-remark` installed directly, it must now be 7.3.0 or later; it no longer has to match Astro's own version exactly.

The `MdxRendererOptions` type exported from `astro/markdown` no longer includes `recmaPlugins`, and gains an optional `srcDir`. This only affects custom Markdown processors that implement `createMdxRenderer`.
