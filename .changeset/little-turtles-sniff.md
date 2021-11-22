---
'@astrojs/markdown-remark': minor
---

- Upgraded dependencies
- Replaced `remark-slug` with `rehype-slug` because [it was deprecated](https://github.com/remarkjs/remark-slug)
- Disable **all** built-in plugins when custom remark and/or rehype plugins are added
- Removed `remark-footnotes` because [`remark-gfm` now supports footnotes](https://github.com/remarkjs/remark-gfm/releases/tag/3.0.0)
- Re-added `@silvenon/remark-smartypants` and `rehype-slug` to the default plugins list
