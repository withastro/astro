---
'@astrojs/internal-helpers': minor
---

Adds an `@astrojs/internal-helpers/mdx` entrypoint with shared helpers used by the Markdown processor packages to render `.mdx` files.

`MdxRendererOptions` gains an optional `srcDir` and no longer carries `recmaPlugins`, so custom processors implementing `createMdxRenderer` need to read their recma plugins from their own options, and must still render when `srcDir` is absent.
