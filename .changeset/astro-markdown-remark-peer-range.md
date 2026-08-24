---
'astro': patch
---

Fixes `@astrojs/markdown-remark` having to match Astro's own version exactly when installed directly. It now requires 7.3.0 or later.

The `MdxRendererOptions` type from `astro/markdown` no longer includes `recmaPlugins` and gains an optional `srcDir`, which only affects custom Markdown processors implementing `createMdxRenderer`.
