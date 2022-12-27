---
'astro': major
'@astrojs/markdown-remark': major
'@astrojs/mdx': minor
---

Refine Markdown and MDX configuration options for ease-of-use.

## Markdown

- **Remove `remark-smartypants`** from Astro's default Markdown plugins.
- **Replace the `extendDefaultPlugins` option** with a simplified `githubFlavoredMarkdown` boolean. This is enabled by default, and can be disabled to remove GFM.
- Ensure GitHub-Flavored Markdown is applied whether or not custom `remarkPlugins` or `rehypePlugins` are configured. If you want to apply custom plugins _and_ remove GFM, manually set `githubFlavoredMarkdown: false` in your config.

## MDX

- Support _all_ Markdown configuration options (except `drafts`) from your MDX integration config. This includes `syntaxHighlighting` and `shikiConfig` options to further customize the MDX renderer.
- Simplify `extendDefaults` to an `extendMarkdownConfig` option. MDX options will be deeply merged with your Markdown config by default. By setting `extendMarkdownConfig` to false, you can "eject" to set your own syntax highlighting and plugins.
