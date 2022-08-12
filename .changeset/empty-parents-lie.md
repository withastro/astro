---
'astro': patch
'@astrojs/mdx': minor
---

Align MD with MDX on layout props and "glob" import results:
- Add `Content` to MDX
- Add `file` and `url` to MDX frontmatter (layout import only)
- Update glob types to reflect differences (lack of `rawContent` and `compiledContent`)
