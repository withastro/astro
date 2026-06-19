---
'@astrojs/markdown-satteri': minor
'@astrojs/mdx': minor
---

Adds support for [modifying frontmatter programmatically](https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically) with the default Markdown processor.

A Sätteri plugin can now read and mutate `ctx.data.astro.frontmatter`, and Astro uses the result as the page's frontmatter, in both Markdown and MDX.
