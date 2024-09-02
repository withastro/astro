---
'astro': major
---

Updates internal Shiki rehype plugin to highlight code blocks as hast (using Shiki's `codeToHast()` API). This allows a more direct Markdown and MDX processing, and improves the performance when building the project, but may cause issues with existing Shiki transformers.

If you are using Shiki transformers passed to `markdown.shikiConfig.transformers`, you must make sure they do not use the `postprocess` hook as it no longer runs on code blocks in `.md` and `.mdx` files. (See [the Shiki documentation on transformer hooks](https://shiki.style/guide/transformers#transformer-hooks) for more information). 

Code blocks in `.mdoc` files and `<Code />` component do not use the internal Shiki rehype plugin and are unaffected.
