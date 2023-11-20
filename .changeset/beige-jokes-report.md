---
'@astrojs/mdx': major
'@astrojs/markdown-remark': major
'astro': major
---

Updates the unified, remark, and rehype dependencies to latest. Make sure to update your custom remark and rehype plugins as well to be compatible with the latest versions.

**Potentially breaking change:** The default value of `markdown.remarkRehype.footnoteBackLabel` is changed from `"Back to content"` to `"Back to reference 1"`. See the `mdast-util-to-hast` [commit](https://github.com/syntax-tree/mdast-util-to-hast/commit/56c88e45690be138fad9f0bf367b939d09816863) for more information.
