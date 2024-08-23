---
'astro': major
---

Updates internal Shiki rehype plugin to highlight code blocks as hast (using Shiki's `codeToHast()` API). This allows a more direct markdown and MDX processing, and improves the performance when building the project.

However, a caveat with `codeToHast()` is that Shiki transformers' `postprocess` hook will now not run on code blocks in `.md` and `.mdx` files (also [documented in Shiki](https://shiki.style/guide/transformers#transformer-hooks)). Make sure the Shiki transformers passed to `markdown.shikiConfig.transformers` do not use the `postprocess` hook to avoid issues with the HTML output.

Code blocks in `.mdoc` files and `<Code />` component will still work the same and shouldn't need any changes as they do not use the internal Shiki rehype plugin.
