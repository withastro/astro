---
'@astrojs/markdown-remark': minor
---

- Removed `renderMarkdownWithFrontmatter` because it wasn't being used
- All options of `renderMarkdown` are now required — see the exported interface `AstroMarkdownOptions`
- New types: RemarkPlugin, RehypePlugin and ShikiConfig
