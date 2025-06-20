---
'astro': minor
'@astrojs/markdown-remark': patch
---

Add TOML support to the built-in content loaders.

In Astro 5.2, Markdown gained support for TOML frontmatter, including for use within content collections.

This changeset extends that functionality to directly support TOML files in content collections.
