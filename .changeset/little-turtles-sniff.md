---
'@astrojs/markdown-remark': minor
'astro': patch
---

- Replaced `remark-slug` with `rehype-slug` everywhere because [it was deprecated](https://github.com/remarkjs/remark-slug)
- Added `MarkdownParser` and `MarkdownParserResponse` to `@types`
- Updated `@astrojs/markdown-remark` dependencies
- Disable **all** built-in plugins of `@astrojs/markdown-remark` when custom remark and/or rehype are added
- Removed `remark-footnotes` because [`remark-gfm` now supports footnotes](https://github.com/remarkjs/remark-gfm/releases/tag/3.0.0)
- Re-added `@silvenon/remark-smartypants` and `rehype-slug` to the default markdown plugins
