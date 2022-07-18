---
'@astrojs/markdown-remark': minor
---

Inject vfile.data into metadata

`VFile` supports a `data` field that Remark / Rehype plugins can use to pass arbitrary metadata for other plugins to use. After content has been processed, this data is merged with `MarkdownMetadata`.
